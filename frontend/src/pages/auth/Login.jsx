import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSplash, setShowSplash] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('auth/token/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('username', response.data.username);
      
      // Lấy role từ response của backend
      const userRole = response.data.role || 'USER';
      localStorage.setItem('role', userRole); 
      
      setShowSplash(true);
      setTimeout(() => {
        navigate(userRole === 'ADMIN' ? '/admin' : '/');
      }, 2200);
    } catch (err) {
      setError('Sai tên đăng nhập hoặc mật khẩu');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundImage: 'url(/bg-login.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <img src="/logo-doan-real.png" alt="Logo Đoàn" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            Đăng nhập hệ thống
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Cộng đồng đoàn viên Hà Quãng
          </p>
        </div>
        <form className="space-y-4 pt-2" onSubmit={handleLogin}>
          {error && <div className="text-red-600 text-xs font-semibold bg-red-50 border border-red-100 p-3 rounded-2xl text-center leading-relaxed">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                placeholder="Tên đăng nhập (username)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center"
            >
              Đăng nhập
            </button>
          </div>
          
          <div className="flex justify-between items-center text-xs font-bold pt-2">
            <Link to="/register" className="text-blue-600 hover:text-blue-700">
              Chưa có tài khoản? Đăng ký ngay
            </Link>
            <Link to="/forgot-password" className="text-slate-450 hover:text-slate-600">
              Quên mật khẩu?
            </Link>
          </div>
        </form>
      </div>

      {/* Dynamic Welcome Splash Overlay */}
      {showSplash && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes logoEntrance {
              0% { transform: scale(0.2) rotate(-60deg); opacity: 0; filter: drop-shadow(0 0 0px rgba(59, 130, 246, 0)); }
              50% { transform: scale(1.3) rotate(15deg); filter: drop-shadow(0 0 45px rgba(59, 130, 246, 0.9)); }
              75% { transform: scale(0.9) rotate(-7deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.5)); }
            }
            @keyframes textEntrance {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .anim-splash-logo {
              animation: logoEntrance 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .anim-splash-text {
              animation: textEntrance 0.8s ease-out 0.6s forwards;
              opacity: 0;
            }
          `}} />
          <div className="text-center space-y-7 px-6">
            <div className="w-44 h-44 md:w-52 md:h-52 mx-auto flex items-center justify-center">
              <img 
                src="/logo-doan-real.png" 
                alt="Logo Đoàn" 
                className="w-full h-full object-contain anim-splash-logo" 
              />
            </div>
            <div className="space-y-2 anim-splash-text">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">Chi Đoàn Hà Quãng</h1>
              <p className="text-blue-400 font-bold text-xs uppercase tracking-widest animate-pulse">Đăng nhập thành công! Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
