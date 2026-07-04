import { useState, useEffect, useRef } from 'react';
import { Send, User, MessageCircle, Search } from 'lucide-react';
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

export default function ChatManager() {
  const currentUsername = localStorage.getItem('username') || getUsernameFromToken() || '';

  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const historyPollRef = useRef(null);
  const threadsPollRef = useRef(null);

  // Fetch threads on mount and start polling thread list
  useEffect(() => {
    fetchThreads();
    threadsPollRef.current = setInterval(fetchThreads, 8000); // Poll threads list every 8s

    return () => {
      if (threadsPollRef.current) clearInterval(threadsPollRef.current);
      if (historyPollRef.current) clearInterval(historyPollRef.current);
    };
  }, []);

  // Poll chat history when active thread changes
  useEffect(() => {
    if (activeThread) {
      fetchHistory(activeThread.user_id);
      
      // Clear previous history polling and start new one
      if (historyPollRef.current) clearInterval(historyPollRef.current);
      historyPollRef.current = setInterval(() => fetchHistory(activeThread.user_id), 3000);
    } else {
      setMessages([]);
      if (historyPollRef.current) clearInterval(historyPollRef.current);
    }

    return () => {
      if (historyPollRef.current) clearInterval(historyPollRef.current);
    };
  }, [activeThread]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchThreads = async () => {
    try {
      const response = await api.get('auth/chat/admin/threads/');
      setThreads(response.data);
    } catch (err) {
      console.error("Failed to fetch threads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (userId) => {
    try {
      const response = await api.get(`auth/chat/admin/thread/${userId}/`);
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeThread) return;

    const content = inputValue;
    setInputValue('');

    // Prepend locally for instant UI update
    const tempMsg = {
      id: Date.now(),
      sender_name: currentUsername,
      content: content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post(`auth/chat/admin/thread/${activeThread.user_id}/`, { content });
      fetchHistory(activeThread.user_id);
      fetchThreads(); // Refresh thread list last message snippet
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Filter threads based on search query
  const filteredThreads = threads.filter(t => 
    t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${t.last_name} ${t.first_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-13rem)] flex font-sans">
      {/* Sidebar: Threads list */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col h-full bg-slate-50/20">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <h2 className="text-base font-black text-slate-800">Trò chuyện hỗ trợ</h2>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm đoàn viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        {/* Thread items list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <p className="text-center py-8 text-xs font-bold text-slate-400">Đang tải cuộc hội thoại...</p>
          ) : filteredThreads.length === 0 ? (
            <p className="text-center py-8 text-xs font-bold text-slate-400">Không tìm thấy cuộc hội thoại nào</p>
          ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.user_id === thread.user_id;
                const isUnread = thread.last_message_sender !== currentUsername && !isSelected;
                const displayName = `${thread.last_name} ${thread.first_name}`.trim() || thread.username;
                return (
                  <div
                    key={thread.user_id}
                    onClick={() => setActiveThread(thread)}
                    className={`flex items-center space-x-3 p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/60 border-l-4 border-blue-600' : 'hover:bg-slate-50/55'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 font-extrabold rounded-xl flex items-center justify-center shrink-0">
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-xs truncate ${isUnread ? 'font-black text-slate-900' : 'font-medium text-slate-650'}`}>{displayName}</h4>
                        {thread.last_message_time && (
                          <span className="text-[9px] font-bold text-slate-400 shrink-0">
                            {new Date(thread.last_message_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${isUnread ? 'font-black text-slate-800' : 'font-normal text-slate-400'}`}>
                        {thread.last_message || 'Chưa có tin nhắn'}
                      </p>
                    </div>
                  </div>
                );
            })
          )}
        </div>
      </div>

      {/* Main Panel: Message history and input */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {activeThread ? (
          <>
            {/* Header info */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm bg-slate-50/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-extrabold shadow-md shadow-blue-500/10">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-snug">
                    {`${activeThread.last_name} ${activeThread.first_name}`.trim() || activeThread.username}
                  </h3>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">@{activeThread.username}</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
              {messages.map((msg) => {
                const isMe = msg.sender_name === currentUsername;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4.5 py-3 text-xs font-semibold shadow-sm leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[9px] font-bold text-slate-400 mb-1">
                          {msg.sender_name}
                        </p>
                      )}
                      <p className="break-words">{msg.content}</p>
                      <span
                        className={`text-[9px] block mt-1.5 text-right ${
                          isMe ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-100 flex items-center gap-3 bg-white"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Nhập câu trả lời gửi đến @${activeThread.username}...`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-semibold text-slate-800"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-5 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 rounded-xl flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-md shadow-blue-500/10 font-bold text-xs transition-colors"
              >
                <Send size={16} />
                <span>Gửi</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <MessageCircle size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-800">Chưa chọn cuộc trò chuyện</h3>
            <p className="text-xs text-slate-450 font-semibold max-w-xs leading-relaxed">
              Vui lòng chọn một đoàn viên từ danh sách bên trái để xem lịch sử thắc mắc và gửi tin nhắn phản hồi hỗ trợ trực tuyến.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
