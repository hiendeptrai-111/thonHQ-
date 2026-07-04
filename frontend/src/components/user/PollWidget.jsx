import { useState, useEffect } from 'react';
import { Award, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import api from '../../api';

export default function PollWidget() {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAuthenticated = !!localStorage.getItem('access_token');

  useEffect(() => {
    fetchLatestPoll();
  }, []);

  const fetchLatestPoll = async () => {
    try {
      const response = await api.get('news/polls/');
      // Lấy cuộc bình chọn đang mở và chưa hết hạn mới nhất
      const activePolls = response.data.filter(p => p.is_active && !p.is_expired);
      if (activePolls.length > 0) {
        setPoll(activePolls[0]);
        setVoted(activePolls[0].has_voted);
        if (activePolls[0].has_voted) {
          setSelectedOption(activePolls[0].selected_option_id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch latest poll", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOption) {
      alert('Vui lòng chọn một phương án.');
      return;
    }
    setSubmitting(true);

    try {
      const response = await api.post(`news/polls/${poll.id}/vote/`, {
        option_id: selectedOption
      });
      setPoll(response.data);
      setVoted(true);
    } catch (error) {
      console.error("Failed to vote", error);
      alert(error.response?.data?.detail || 'Lỗi khi biểu quyết. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-2/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded"></div>
          <div className="h-4 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null; // Không có cuộc bình chọn nào đang hoạt động
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <span className="w-2.5 h-6 bg-blue-600 rounded-full"></span>
        <h3 className="text-lg font-bold text-slate-800">Thăm dò ý kiến</h3>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-800 leading-snug">{poll.question}</p>
        
        {poll.expires_at && (
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Hạn cuối: {new Date(poll.expires_at).toLocaleString('vi-VN')}
          </p>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500">
            Bạn cần <a href="/login" className="text-blue-600 hover:underline font-bold">Đăng nhập</a> để tham gia biểu quyết ý kiến.
          </p>
        </div>
      ) : voted ? (
        // Voted view: Show thank you message
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Cảm ơn bạn!</h4>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">Ý kiến đóng góp của bạn đã được ghi nhận vào hệ thống.</p>
          </div>
        </div>
      ) : (
        // Vote form view
        <form onSubmit={handleVoteSubmit} className="space-y-3 pt-2">
          <div className="space-y-2">
            {poll.options.map((opt) => (
              <label key={opt.id} className="flex items-center space-x-3 p-3 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                <input
                  type="radio"
                  name="poll_option"
                  value={opt.id}
                  checked={selectedOption === opt.id}
                  onChange={() => setSelectedOption(opt.id)}
                  className="w-4 h-4 text-blue-600 border-slate-200 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-700">{opt.option_text}</span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={submitting || !selectedOption}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all text-xs flex items-center justify-center space-x-2"
          >
            <span>Gửi bình chọn</span>
          </button>
        </form>
      )}
    </div>
  );
}
