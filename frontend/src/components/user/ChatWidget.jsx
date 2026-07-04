import { useState, useEffect, useRef } from 'react';
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

export default function ChatWidget() {
  const currentUsername = localStorage.getItem('username') || getUsernameFromToken() || '';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Load chat history when widget opens
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      setUnreadCount(0); // clear unread count when opened
      
      // Start polling every 3 seconds for new messages
      pollingRef.current = setInterval(fetchMessages, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Run initial poll for unread notifications even when closed
  useEffect(() => {
    const checkNewMessages = async () => {
      try {
        const response = await api.get('auth/chat/');
        const msgs = response.data;
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          // If last message is from Admin and widget is closed
          if (lastMsg.sender_name !== currentUsername && !isOpen) {
            setUnreadCount(1);
          }
        }
      } catch (err) {
        console.error("Failed to check chat updates:", err);
      }
    };

    // Check once at mount and every 10 seconds when closed
    checkNewMessages();
    const interval = setInterval(() => {
      if (!isOpen) {
        checkNewMessages();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('auth/chat/');
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue('');
    
    // Add locally for instant UI update
    const tempMsg = {
      id: Date.now(),
      sender_name: currentUsername,
      content: content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post('auth/chat/', { content });
      fetchMessages(); // Sync history
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer relative"
        >
          <MessageCircle size={26} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
              !
            </span>
          )}
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[380px] h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white font-extrabold">
                <User size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black leading-snug">Hỗ trợ trực tuyến</h4>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Ban Chấp Hành Đoàn thôn Hà Quảng Đông</span>
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
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <span
                        className={`text-[9px] block mt-1 text-right ${
                          isMe ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
              disabled={!inputValue.trim()}
              className="w-9.5 h-9.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 rounded-xl flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
