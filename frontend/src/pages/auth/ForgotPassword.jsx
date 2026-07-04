import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, ShieldAlert } from 'lucide-react';
import api from '../../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    setError('');
    setSuccess('');
    setSendingCode(true);

    try {
      await api.post('auth/password-reset/send-code/', { email });
      setIsCodeSent(true);
      setCooldown(60);
      setSuccess('Mã xác minh đặt lại mật khẩu đã được gửi đến email của bạn.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Lỗi khi gửi mã đặt lại mật khẩu. Vui lòng kiểm tra lại email.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode) {
      setError('Vui lòng nhập mã xác minh.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/password-reset/verify/', {
        email,
        verification_code: verificationCode,
        new_password: newPassword
      });
      setSuccess('Đặt lại mật khẩu thành công! Đang chuyển hướng đến trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Đặt lại mật khẩu thất bại. Mã xác thực không đúng hoặc đã hết hạn.');
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
          <div className="mx-auto w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            Quên mật khẩu?
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Đặt lại mật khẩu tài khoản đoàn viên
          </p>
        </div>

        {error && <div className="text-red-600 text-xs font-semibold bg-red-50 border border-red-100 p-3 rounded-2xl text-center leading-relaxed">{error}</div>}
        {success && <div className="text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center leading-relaxed">{success}</div>}

        {!isCodeSent ? (
          // Form 1: Request OTP
          <form className="space-y-4 pt-2" onSubmit={handleSendCode}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Địa chỉ Email đã đăng ký</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sendingCode}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{sendingCode ? 'Đang gửi mã...' : 'Gửi mã xác minh'}</span>
            </button>
          </form>
        ) : (
          // Form 2: Enter OTP and Reset Password
          <form className="space-y-4 pt-2" onSubmit={handleResetPassword}>
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs space-y-1 font-semibold text-slate-500">
              <p>Hệ thống đã gửi mã đặt lại mật khẩu đến:</p>
              <p className="text-slate-800 font-bold">{email}</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã xác minh Email</label>
                <button
                  type="button"
                  disabled={sendingCode || cooldown > 0}
                  onClick={handleSendCode}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound size={16} />
                </span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-black tracking-widest text-slate-800"
                  placeholder="123456"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-800"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}</span>
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 transition-colors">
            <ArrowLeft size={14} />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
