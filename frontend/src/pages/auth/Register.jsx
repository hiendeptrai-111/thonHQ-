import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Send, KeyRound, Mail, User, ShieldCheck } from 'lucide-react';
import api from '../../api';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    verification_code: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendCode = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập địa chỉ email trước.');
      return;
    }
    setError('');
    setSuccess('');
    setSendingCode(true);

    try {
      await api.post('auth/register/send-code/', { email: formData.email });
      setIsCodeSent(true);
      setCooldown(60); // 60 seconds cooldown
      setSuccess('Mã xác minh đã được gửi! Vui lòng kiểm tra hộp thư email của bạn.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Lỗi khi gửi mã xác minh. Vui lòng kiểm tra lại email.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isCodeSent && !formData.verification_code) {
      setError('Vui lòng nhập mã xác minh đã được gửi.');
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/register/', formData);
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data) {
        // Extract field validation errors
        const errorMsg = Object.values(err.response.data).flat().join(', ');
        setError(errorMsg || 'Đăng ký thất bại. Vui lòng thử lại.');
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
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
      <div className="max-w-md w-full space-y-6 bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            Đăng ký tài khoản
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Cộng đồng đoàn viên Hà Quãng
          </p>
        </div>

        <form className="space-y-4 pt-2" onSubmit={handleRegister}>
          {error && <div className="text-red-600 text-xs font-semibold bg-red-50 border border-red-100 p-3 rounded-2xl text-center leading-relaxed">{error}</div>}
          {success && <div className="text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center leading-relaxed">{success}</div>}
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Họ</label>
              <input
                type="text"
                name="last_name"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                placeholder="Nguyễn Văn"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tên</label>
              <input
                type="text"
                name="first_name"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                placeholder="A"
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tên đăng nhập</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                name="username"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                placeholder="username123"
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Địa chỉ Email (Thật)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={isCodeSent} // Lock email once code is sent to prevent registration bypass
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="name@example.com"
                  onChange={handleChange}
                />
              </div>
              <button
                type="button"
                disabled={sendingCode || cooldown > 0 || isCodeSent}
                onClick={handleSendCode}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 shrink-0 cursor-pointer"
              >
                {sendingCode ? 'Đang gửi...' : cooldown > 0 ? `Gửi lại (${cooldown}s)` : isCodeSent ? 'Đã gửi mã' : 'Gửi mã'}
              </button>
            </div>
          </div>

          {/* Verification Code Box (Appears after code is sent) */}
          {isCodeSent && (
            <div className="animate-fadeIn">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mã xác minh Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound size={16} />
                </span>
                <input
                  type="text"
                  name="verification_code"
                  required
                  maxLength={6}
                  value={formData.verification_code}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-black tracking-widest text-slate-800"
                  placeholder="123456"
                  onChange={handleChange}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                <span>* Một email chứa mã OTP 6 số đã gửi tới hòm thư của bạn.</span>
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                name="password"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || (isCodeSent && !formData.verification_code)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Đăng ký</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-bold text-blue-600 hover:underline">
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
