import { useState, useEffect } from 'react';
import { Award, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import api from '../../api';

export default function PollList() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState({}); // Mapping of pollId -> optionId
  const [submittingMap, setSubmittingMap] = useState({});

  const isAuthenticated = !!localStorage.getItem('access_token');

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await api.get('news/polls/');
      setPolls(response.data);
      // Pre-populate already selected options from database response
      const preselected = {};
      response.data.forEach(p => {
        if (p.has_voted && p.selected_option_id) {
          preselected[p.id] = p.selected_option_id;
        }
      });
      setSelectedOptions(preselected);
    } catch (error) {
      console.error("Failed to fetch polls list", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = async (pollId) => {
    const selectedOption = selectedOptions[pollId];
    if (!selectedOption) {
      alert('Vui lòng chọn một phương án trước khi biểu quyết.');
      return;
    }

    setSubmittingMap(prev => ({ ...prev, [pollId]: true }));
    try {
      const response = await api.post(`news/polls/${pollId}/vote/`, {
        option_id: selectedOption
      });
      // Update poll in local state
      setPolls(prev => prev.map(p => p.id === pollId ? response.data : p));
    } catch (error) {
      console.error("Failed to vote", error);
      alert(error.response?.data?.detail || 'Lỗi khi bỏ phiếu. Vui lòng thử lại.');
    } finally {
      setSubmittingMap(prev => ({ ...prev, [pollId]: false }));
    }
  };

  const handleOptionChange = (pollId, optionId) => {
    setSelectedOptions(prev => ({ ...prev, [pollId]: optionId }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      <div className="border-b border-slate-150 pb-6">
        <h1 className="text-3xl font-black text-slate-900">Khảo sát & Thăm dò ý kiến</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">
          Nơi đoàn viên thanh niên đóng góp ý kiến xây dựng phong trào Đoàn vững mạnh
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 font-semibold text-slate-500">Đang tải danh sách khảo sát...</div>
      ) : polls.length === 0 ? (
        <div className="text-center py-12 font-semibold text-slate-500">Hiện tại chưa có cuộc khảo sát nào trên hệ thống</div>
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => {
            const hasVoted = poll.has_voted;
            const isExpired = poll.is_expired;
            const isClosed = !poll.is_active || isExpired;
            
            return (
              <div key={poll.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-6 bg-blue-600 rounded-full"></span>
                    <h3 className="text-lg font-bold text-slate-800">Biểu quyết #{poll.id}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isExpired
                      ? 'text-red-700 bg-red-50 border-red-200'
                      : !poll.is_active
                      ? 'text-slate-500 bg-slate-100 border-slate-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    {isExpired ? 'Đã kết thúc' : !poll.is_active ? 'Đã đóng' : 'Đang mở'}
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug">{poll.question}</p>
                  
                  {poll.expires_at && (
                    <p className="text-xs text-slate-400 font-semibold">
                      Thời hạn: {new Date(poll.expires_at).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>

                {!isAuthenticated ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <p className="text-sm font-semibold text-slate-500">
                      Vui lòng <Link to="/login" className="text-blue-600 hover:underline font-bold">Đăng nhập</Link> để tham gia biểu quyết ý kiến.
                    </p>
                  </div>
                ) : (hasVoted || isClosed) ? (
                  // Stats View (Show thank you message or closed status instead of results)
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">
                        {hasVoted ? 'Cảm ơn bạn đã bình chọn!' : 'Cuộc bình chọn đã kết thúc'}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        {hasVoted 
                          ? 'Ý kiến đóng góp của bạn đã được lưu trữ an toàn trong hệ thống.' 
                          : 'Rất tiếc, thời hạn bình chọn cho nội dung này đã khép lại.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Vote Input Form
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {poll.options.map((opt) => (
                        <label 
                          key={opt.id} 
                          className={`flex items-center space-x-3 p-4 border rounded-2xl cursor-pointer hover:bg-slate-50/50 transition-colors ${
                            selectedOptions[poll.id] === opt.id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`poll_${poll.id}_option`}
                            value={opt.id}
                            checked={selectedOptions[poll.id] === opt.id}
                            onChange={() => handleOptionChange(poll.id, opt.id)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-200 focus:ring-blue-500"
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.option_text}</span>
                        </label>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handleVoteSubmit(poll.id)}
                      disabled={submittingMap[poll.id] || !selectedOptions[poll.id]}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all text-sm flex items-center justify-center space-x-2 w-fit"
                    >
                      <Send size={16} />
                      <span>Xác nhận biểu quyết</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
