import { useState, useEffect } from 'react';
import { Lightbulb, Trash2, Calendar, User } from 'lucide-react';
import api from '../../api';

export default function IdeaManager() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const response = await api.get('news/ideas/');
      setIdeas(response.data);
    } catch (err) {
      console.error("Failed to fetch ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIdea = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đề xuất ý tưởng này không?")) return;
    try {
      await api.delete(`news/ideas/${id}/`);
      setIdeas(prev => prev.filter(idea => idea.id !== id));
      if (selectedIdea?.id === id) {
        setSelectedIdea(null);
      }
    } catch (err) {
      alert("Không thể xóa ý tưởng. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Lightbulb size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Ý tưởng & Đề xuất từ Đoàn viên</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Quản lý và xét duyệt các sáng kiến xây dựng phong trào Chi Đoàn Hà Quãng.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Ideas list */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden h-[calc(100vh-17rem)] flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/20">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Danh sách ý tưởng ({ideas.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <p className="text-center py-12 text-xs font-bold text-slate-400">Đang tải danh sách ý tưởng...</p>
            ) : ideas.length === 0 ? (
              <div className="text-center py-12 px-6 space-y-2">
                <p className="text-xs font-bold text-slate-450">Chưa có ý tưởng nào</p>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">Khi đoàn viên gửi đề xuất đóng góp ý tưởng từ trang chủ, danh sách sẽ hiển thị tại đây.</p>
              </div>
            ) : (
              ideas.map((idea) => {
                const isSelected = selectedIdea?.id === idea.id;
                return (
                  <div
                    key={idea.id}
                    onClick={() => setSelectedIdea(idea)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/60 border-l-4 border-blue-600' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <h4 className="text-xs font-black text-slate-800 truncate mb-1">{idea.title}</h4>
                    <p className="text-[11px] text-slate-450 font-semibold truncate mb-2">{idea.content}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span>@{idea.author_name}</span>
                      <span>{new Date(idea.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Idea Detail view */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm h-[calc(100vh-17rem)] flex flex-col overflow-hidden">
          {selectedIdea ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/20">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{selectedIdea.title}</h3>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      <span>{selectedIdea.author_full_name} (@{selectedIdea.author_name})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(selectedIdea.created_at).toLocaleString('vi-VN')}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteIdea(selectedIdea.id)}
                  className="text-red-500 hover:text-white border border-red-200 hover:bg-red-500 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm hover:shadow-red-500/10"
                >
                  <Trash2 size={14} />
                  <span>Xóa</span>
                </button>
              </div>

              {/* Content Body */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
                <div className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  {selectedIdea.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Lightbulb size={32} />
              </div>
              <h3 className="text-sm font-black text-slate-800">Chưa chọn ý tưởng đề xuất</h3>
              <p className="text-xs text-slate-450 font-semibold max-w-xs leading-relaxed">
                Vui lòng chọn một ý tưởng sáng tạo đóng góp từ danh sách bên trái để xem nội dung đề xuất chi tiết từ Đoàn viên.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
