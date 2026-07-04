import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, CheckCircle2, AlertTriangle, Eye, EyeOff, X, Edit, Info } from 'lucide-react';
import api from '../../api';

export default function PollManager() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [question, setQuestion] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with 2 empty options
  const [sendNotification, setSendNotification] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await api.get('news/polls/');
      setPolls(response.data);
    } catch (error) {
      console.error("Failed to fetch polls", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOptionField = () => {
    if (editingPoll && editingPoll.total_votes > 0) return; // Prevent adding if votes exist
    setOptions([...options, '']);
  };

  const handleRemoveOptionField = (index) => {
    if (options.length <= 2) return; 
    if (editingPoll && editingPoll.total_votes > 0) return; // Prevent removing if votes exist
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionTextChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc bình chọn này?')) {
      try {
        await api.delete(`news/polls/${id}/`);
        fetchPolls();
      } catch (error) {
        alert('Lỗi khi xóa cuộc bình chọn');
      }
    }
  };

  const toggleActive = async (poll) => {
    try {
      await api.patch(`news/polls/${poll.id}/`, { is_active: !poll.is_active });
      fetchPolls();
    } catch (error) {
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openAddModal = () => {
    setEditingPoll(null);
    setQuestion('');
    setExpiresAt('');
    setOptions(['', '']);
    setSendNotification(false);
    setIsModalOpen(true);
  };

  const openEditModal = (poll) => {
    setEditingPoll(poll);
    setQuestion(poll.question);
    setExpiresAt(formatDateForInput(poll.expires_at));
    setOptions(poll.options.map(opt => opt.option_text));
    setSendNotification(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      alert('Vui lòng nhập ít nhất 2 phương án bình chọn.');
      return;
    }

    try {
      const payload = {
        question,
        options: filledOptions,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: editingPoll ? editingPoll.is_active : true,
        send_notification: sendNotification
      };
      
      if (editingPoll) {
        // Edit mode
        await api.put(`news/polls/${editingPoll.id}/`, payload);
      } else {
        // Create mode
        await api.post('news/polls/', payload);
      }

      setIsModalOpen(false);
      
      // Reset form
      setQuestion('');
      setExpiresAt('');
      setOptions(['', '']);
      setEditingPoll(null);
      fetchPolls();
    } catch (error) {
      console.error("Failed to save poll", error);
      alert(error.response?.data?.detail || 'Lỗi khi lưu cuộc bình chọn');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-800">Quản lý Bình chọn</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Tạo các cuộc khảo sát, thăm dò ý kiến đoàn viên thanh niên</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transform hover:-translate-y-0.5"
        >
          <Plus size={18} />
          <span>Tạo bình chọn mới</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 font-extrabold">
              <th className="p-5 font-bold">Câu hỏi bình chọn / Khảo sát</th>
              <th className="p-5 font-bold">Các phương án & kết quả hiện tại</th>
              <th className="p-5 font-bold">Hạn bình chọn</th>
              <th className="p-5 font-bold">Tổng lượt vote</th>
              <th className="p-5 font-bold">Trạng thái</th>
              <th className="p-5 font-bold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500 font-semibold">Đang tải danh sách khảo sát...</td></tr>
            ) : polls.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">Chưa có cuộc khảo sát nào được tạo</td></tr>
            ) : (
              polls.map((poll) => (
                <tr key={poll.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <td className="p-5 max-w-xs">
                    <span className="text-sm font-bold text-slate-900 leading-snug">{poll.question}</span>
                  </td>
                  <td className="p-5 min-w-[300px]">
                    <div className="space-y-2.5">
                      {poll.options.map((opt) => {
                        const percent = poll.total_votes > 0 ? Math.round((opt.votes_count / poll.total_votes) * 100) : 0;
                        return (
                          <div key={opt.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>{opt.option_text}</span>
                              <span>{opt.votes_count} vote ({percent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-5 text-xs text-slate-500 font-semibold">
                    {poll.expires_at ? (
                      <span className="flex items-center space-x-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{new Date(poll.expires_at).toLocaleString('vi-VN')}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Không giới hạn</span>
                    )}
                  </td>
                  <td className="p-5 text-sm font-black text-slate-800 text-center">{poll.total_votes}</td>
                  <td className="p-5">
                    <button
                      onClick={() => toggleActive(poll)}
                      disabled={poll.is_expired}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                        poll.is_expired
                          ? 'text-red-700 bg-red-50 border-red-200 cursor-not-allowed'
                          : poll.is_active
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {poll.is_expired ? (
                        <>
                          <AlertTriangle size={12} />
                          <span>Hết hạn</span>
                        </>
                      ) : poll.is_active ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Đang mở</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          <span>Đã khóa</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-5">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openEditModal(poll)}
                        className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200" 
                        title="Chỉnh sửa bình chọn"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(poll.id)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all duration-200" 
                        title="Xóa bình chọn"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Poll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingPoll ? 'Chỉnh sửa cuộc bình chọn' : 'Tạo cuộc bình chọn mới'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Đặt câu hỏi khảo sát và cấu hình các lựa chọn</p>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingPoll(null); }}
                className="text-gray-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {editingPoll && editingPoll.total_votes > 0 && (
                <div className="flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl text-xs font-semibold leading-relaxed">
                  <Info size={16} className="shrink-0 text-amber-500 mt-0.5" />
                  <span>Không thể chỉnh sửa, thêm hoặc xóa các phương án bình chọn vì khảo sát này đã có đoàn viên bỏ phiếu. Bạn chỉ có thể sửa câu hỏi và thời gian kết thúc.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Câu hỏi khảo sát</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ví dụ: Bạn thấy phong trào Mùa hè xanh năm nay thế nào?"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Thời hạn kết thúc (Có thể bỏ trống)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Các phương án lựa chọn</label>
                  {(!editingPoll || editingPoll.total_votes === 0) && (
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      + Thêm phương án
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        disabled={editingPoll && editingPoll.total_votes > 0}
                        value={opt}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        placeholder={`Phương án lựa chọn thứ ${index + 1}`}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                      {options.length > 2 && (!editingPoll || editingPoll.total_votes === 0) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(index)}
                          className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendNotification}
                    onChange={(e) => setSendNotification(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-slate-200 rounded-lg focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-blue-600 font-bold">Gửi thông báo đến đoàn viên</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingPoll(null); }}
                  className="px-5 py-3 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10"
                >
                  {editingPoll ? 'Lưu thay đổi' : 'Tạo cuộc khảo sát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
