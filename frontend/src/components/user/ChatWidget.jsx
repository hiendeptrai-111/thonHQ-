import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import api from '../../api';

const getUsernameFromToken = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).username;
  } catch (e) {
    return null;
  }
};

const CACHE_KEY = 'hqd_chat_messages';

export default function ChatWidget() {
  const currentUsername = localStorage.getItem('username') || getUsernameFromToken() || '';

  const [isOpen, setIsOpen] = useState(false);
  // Load cached messages immediately on init
  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle' | 'connected' | 'error'
  
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const lastMsgCountRef = useRef(0);

  // Save messages to localStorage whenever they update
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Only cache last 100 messages to avoid localStorage overflow
        const toCache = messages.slice(-100);
        localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
      } catch (e) {
        console.warn('Failed to cache chat messages:', e);
      }
    }
  }, [messages]);

  // Fetch messages from server
  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get('auth/chat/');
      const serverMsgs = response.data;
      setMessages(serverMsgs);
      setConnectionStatus('connected');

      // Check for new messages from admin (for unread badge)
      if (serverMsgs.length > lastMsgCountRef.current && !isOpen) {
        const lastMsg = serverMsgs[serverMsgs.length - 1];
        if (lastMsg.sender_name !== currentUsername) {
          setUnreadCount(prev => prev + (serverMsgs.length - lastMsgCountRef.current));
        }
      }
      lastMsgCountRef.current = serverMsgs.length;
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
      setConnectionStatus('error');
    }
  }, [currentUsername, isOpen]);

  // Polling logic when widget is open
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      setUnreadCount(0);
      
      // Poll every 2 seconds for snappy updates
      pollingRef.current = setInterval(fetchMessages, 2000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, fetchMessages]);

  // Background polling when widget is closed (every 15s for unread badge)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        fetchMessages();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isOpen, fetchMessages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue('');
    setIsSending(true);
    
    // Add locally for instant UI update (optimistic)
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_name: currentUsername,
      content: content,
      created_at: new Date().toISOString(),
      _pending: true
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post('auth/chat/', { content });
      // Fetch fresh messages to replace optimistic one
      await fetchMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
      // Mark the temp message as failed
      setMessages(prev => prev.map(m => 
        m.id === tempMsg.id ? { ...m, _failed: true, _pending: false } : m
      ));
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + 
           ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer relative"
          style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
        >
          <MessageCircle size={26} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div 
          className="w-[360px] sm:w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          style={{ animation: 'slideUpFade 0.3s ease-out' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white font-extrabold">
                <User size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black leading-snug">Hỗ trợ trực tuyến</h4>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span 
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 
                      connectionStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                    }`}
                  ></span>
                  <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">
                    {connectionStatus === 'connected' ? 'Đang hoạt động' : 
                     connectionStatus === 'error' ? 'Mất kết nối' : 'Đang kết nối...'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <MessageCircle size={22} />
                </div>
                <p className="text-xs font-bold text-slate-800">Xin chào đoàn viên!</p>
                <p className="text-[11px] text-slate-400 font-semibold max-w-[200px]">Bạn có thắc mắc hoặc đề xuất gì? Hãy gửi tin nhắn cho Ban Chấp Hành Đoàn thôn Hà Quảng Đông tại đây nhé.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_name === currentUsername;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-sm leading-relaxed ${
                        isMe
                          ? msg._failed 
                            ? 'bg-red-100 text-red-700 rounded-br-none border border-red-200'
                            : msg._pending 
                              ? 'bg-blue-400 text-white rounded-br-none opacity-70'
                              : 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {msg._failed && (
                          <span className="text-[9px] text-red-500 font-bold">Gửi thất bại</span>
                        )}
                        {msg._pending && (
                          <span className="text-[9px] text-blue-200">Đang gửi...</span>
                        )}
                        <span
                          className={`text-[9px] block text-right ${
                            isMe ? (msg._failed ? 'text-red-400' : 'text-blue-200') : 'text-slate-400'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập nội dung tin nhắn..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-semibold text-slate-800"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className="w-9.5 h-9.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 rounded-xl flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(37, 99, 235, 0.7); }
        }
      `}</style>
    </div>
  );
}
