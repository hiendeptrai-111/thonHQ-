import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, MessageSquare, Bell, User, Vote, MessageCircle, Lightbulb, Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Quản lý Tin tức', path: '/admin/news', icon: <FileText size={20} /> },
    { name: 'Quản lý Người dùng', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Bình luận', path: '/admin/comments', icon: <MessageSquare size={20} /> },
    { name: 'Quản lý Bình chọn', path: '/admin/polls', icon: <Vote size={20} /> },
    { name: 'Hỗ trợ trực tuyến', path: '/admin/chat', icon: <MessageCircle size={20} /> },
    { name: 'Ý tưởng đoàn viên', path: '/admin/ideas', icon: <Lightbulb size={20} /> },
    { name: 'Cài đặt', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const SidebarContent = ({ onNavClick }) => (
    <>
      <div className="h-20 flex items-center px-6 border-b border-white/5 space-x-3 bg-blue-950/20 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white p-0.5 shadow-lg flex-shrink-0">
          <img src="/logo-doan-real.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <span className="text-base font-black tracking-wider bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent truncate">Hà Quãng</span>
          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Hệ thống Quản trị</span>
        </div>
        {/* Close button on mobile */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={22} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1.5 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onNavClick}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/20 font-semibold' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
                )}
                <span className={`transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-950/20 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 text-slate-400 hover:text-red-400 w-full px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all duration-300 font-medium text-sm group"
        >
          <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-blue-900 via-slate-900 to-slate-900 text-white flex-col hidden md:flex fixed h-full z-10 shadow-xl border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-blue-900 via-slate-900 to-slate-900 text-white flex flex-col z-50 md:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onNavClick={() => setIsMobileMenuOpen(false)} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        {/* Modern Top Header */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 transition-all">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Button - Mobile only */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">
                {navItems.find(item => item.path === location.pathname)?.name || 'Bảng điều khiển'}
              </h1>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 hidden sm:block">Trang chủ / Admin Portal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-6">
            {/* Profile info */}
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-bold text-slate-800">Admin</span>
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Chi Đoàn</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/10">
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages view */}
        <main className="flex-1 p-4 md:p-8 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
