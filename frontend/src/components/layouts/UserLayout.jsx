import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, User, LogOut, ChevronDown, Menu, FileText, Vote, X, Mail, MapPin, Phone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import ChatWidget from '../user/ChatWidget';

export default function UserLayout() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('access_token');
  const userRole = localStorage.getItem('role');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Sync unread count when notifications or localStorage changes
  useEffect(() => {
    const syncUnreadCount = () => {
      if (notifications.length > 0) {
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const unread = notifications.filter(n => !readIds.includes(n.id)).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    };

    syncUnreadCount();

    // Listen to local storage event to update unread count in real-time
    window.addEventListener('storage', syncUnreadCount);
    return () => window.removeEventListener('storage', syncUnreadCount);
  }, [notifications]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('news/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const handleBellClick = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    
    // If opening notifications, mark all current ones as read
    if (nextState && notifications.length > 0) {
      const currentIds = notifications.map(n => n.id);
      localStorage.setItem('read_notifications', JSON.stringify(currentIds));
      setUnreadCount(0);
    }
  };

  const categories = ['Hoạt động Đoàn', 'Tuyên truyền', 'Sự kiện', 'Tình nguyện'];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans flex flex-col">
      {/* Header/Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full p-1 shadow-md group-hover:shadow-lg transition-shadow">
                  <img src="/logo-doan-real.png" alt="Logo Đoàn" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-2xl tracking-tight text-gray-900 leading-none">Hà Quãng</span>
                  <span className="text-xs font-medium text-primary uppercase tracking-widest mt-1">Đoàn Thanh Niên</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Categories & Polls in Header */}
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/" className="text-gray-600 hover:text-primary px-4 py-2.5 rounded-full font-semibold flex items-center space-x-2 transition-all hover:bg-blue-50">
                <Home size={18} />
                <span>Trang chủ</span>
              </Link>
              
              <Link to="/news" className="text-gray-600 hover:text-primary px-4 py-2.5 rounded-full font-semibold flex items-center space-x-2 transition-all hover:bg-blue-50">
                <FileText size={18} />
                <span>Tin tức</span>
              </Link>

              <Link to="/polls" className="text-gray-600 hover:text-primary px-4 py-2.5 rounded-full font-semibold flex items-center space-x-2 transition-all hover:bg-blue-50">
                <Vote size={18} />
                <span>Bình chọn</span>
              </Link>
              
              <div className="relative group px-2">
                <button className="flex items-center space-x-1 text-gray-600 hover:text-primary px-4 py-2.5 rounded-full font-semibold transition-all hover:bg-blue-50">
                  <span>Danh mục</span>
                  <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 overflow-hidden">
                  <div className="py-2">
                    {categories.map((cat, idx) => (
                      <Link key={idx} to={`/category/${cat}`} className="block px-6 py-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-primary font-medium transition-colors">
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4 border-l border-gray-200 pl-6 ml-2">
                  {userRole === 'ADMIN' && (
                    <Link to="/admin" className="text-white bg-gray-900 hover:bg-gray-800 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md">
                      Trang Quản trị
                    </Link>
                  )}
                  
                  {/* Nút Thông báo dạng Click Dropdown */}
                  <div className="relative" ref={notificationRef}>
                    <button 
                      onClick={handleBellClick}
                      className="relative text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-blue-50 cursor-pointer outline-none"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                        </span>
                      )}
                    </button>

                    {/* Popover thông báo chi tiết */}
                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-3.5 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-2 max-h-[350px] overflow-y-auto transform translate-y-0 opacity-100 transition-all duration-300">
                        <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông báo từ BCH</span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{unreadCount} mới</span>
                          )}
                        </div>
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-slate-400 text-xs font-semibold">Chưa có thông báo nào mới</div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => {
                                setSelectedNotification(notif);
                                setIsNotificationsOpen(false);
                              }}
                              className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors last:border-0"
                            >
                              <h4 className="text-xs font-bold text-slate-800 leading-snug hover:text-blue-600 transition-colors">{notif.title}</h4>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{notif.content}</p>
                              <span className="text-[9px] text-slate-400 font-bold block mt-1">{new Date(notif.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-gray-700 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-400 rounded-full flex items-center justify-center text-white shadow-sm">
                      <User size={16} />
                    </div>
                    <span className="font-semibold text-sm">Đoàn viên</span>
                  </div>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2.5 rounded-full hover:bg-red-50 transition-colors" title="Đăng xuất">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 border-l border-gray-200 pl-6 ml-2">
                  <Link to="/login" className="text-gray-600 hover:text-primary px-5 py-2.5 font-semibold transition-colors rounded-xl hover:bg-blue-50">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-primary p-2">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/" className="block px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary">Trang chủ</Link>
              <Link to="/news" className="block px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary">Tin tức</Link>
              <Link to="/polls" className="block px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary">Bình chọn</Link>
              
              <div className="px-3 py-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Danh mục</div>
              {categories.map((cat, idx) => (
                <Link key={idx} to={`/category/${cat}`} className="block px-3 py-2 pl-6 rounded-lg text-base font-medium text-gray-600 hover:bg-blue-50 hover:text-primary">{cat}</Link>
              ))}
              
              <div className="border-t border-gray-100 mt-4 pt-4">
                {isAuthenticated ? (
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-3 rounded-lg text-base font-semibold text-red-500 hover:bg-red-50">Đăng xuất</button>
                ) : (
                  <>
                    <Link to="/login" className="block px-3 py-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary">Đăng nhập</Link>
                    <Link to="/register" className="block px-3 py-3 rounded-lg text-base font-semibold text-primary bg-blue-50">Đăng ký</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto pb-12">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-8 mt-auto font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-slate-800">
          {/* Column 1: Info & Slogan */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white p-0.5 shadow-md">
                <img src="/logo-doan-real.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-black text-white text-lg tracking-tight">Chi Đoàn Hà Quãng</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-sm">
              Đoàn TNCS Hồ Chí Minh - Chi Đoàn Hà Quãng. Nơi rèn luyện bản lĩnh, phát huy nhiệt huyết sáng tạo và tinh thần xung kích vì cộng đồng của tuổi trẻ Hà Quãng.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-widest border-l-2 border-blue-500 pl-2">Liên kết nhanh</h4>
            <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-400">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">Trang chủ</Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-blue-400 transition-colors">Tin tức & Sự kiện</Link>
              </li>
              <li>
                <Link to="/polls" className="hover:text-blue-400 transition-colors">Khảo sát biểu quyết</Link>
              </li>
              {isAuthenticated ? (
                <li>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      navigate('/login');
                    }}
                    className="hover:text-red-400 transition-colors text-left cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-blue-400 transition-colors">Đăng nhập</Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-blue-400 transition-colors">Đăng ký</Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-widest border-l-2 border-blue-500 pl-2">Thông tin liên hệ</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
              <li className="flex items-start space-x-2">
                <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Nhà văn hóa thôn Hà Quãng, Xã Điện Dương, Thị xã Điện Bàn, Tỉnh Quảng Nam</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-blue-500 shrink-0" />
                <span>doanthonhqd@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-blue-500 shrink-0" />
                <span>0987.654.321</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & socials */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs font-semibold text-slate-500 text-center sm:text-left leading-normal">
            &copy; 2026 Chi Đoàn Hà Quãng. Phát triển bởi tuổi trẻ tiên phong Hà Quãng.
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all text-slate-400"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H7v3h2v9h3v-9h2.72l.31-3H12V6.5a1 1 0 0 1 1-1h1.5V2H12a4 4 0 0 0-4 4v2z"/>
              </svg>
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all text-slate-400"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.025 0 12 0 12s0 3.975.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.475 20.455 12 20.455 12 20.455s7.525 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108C24 15.975 24 12 24 12s0-3.975-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a 
              href="mailto:doanthonhqd@gmail.com" 
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all text-slate-400"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>
      </footer>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">{selectedNotification.title}</h3>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="text-gray-405 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Gửi ngày: {new Date(selectedNotification.created_at).toLocaleString('vi-VN')}
            </p>
            <div className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap">
              {selectedNotification.content}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
              >
                Đóng
              </button>
              {selectedNotification.target_url && (
                <Link
                  to={selectedNotification.target_url}
                  onClick={() => setSelectedNotification(null)}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10"
                >
                  Xem chi tiết
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {isAuthenticated && <ChatWidget />}
    </div>
  );
}
