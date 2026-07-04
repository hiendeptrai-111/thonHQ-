import { useState, useEffect } from 'react';
import { Trash2, Eye, EyeOff, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function CommentManager() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await api.get('news/comments/');
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHidden = async (comment) => {
    try {
      await api.patch(`news/comments/${comment.id}/`, { is_hidden: !comment.is_hidden });
      fetchComments();
    } catch (error) {
      alert('Lỗi khi cập nhật trạng thái bình luận');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này vĩnh viễn?')) {
      try {
        await api.delete(`news/comments/${id}/`);
        fetchComments();
      } catch (error) {
        alert('Lỗi khi xóa bình luận');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col justify-between gap-2 bg-white/50">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-800">Quản lý Bình luận</h2>
        </div>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Duyệt, ẩn hoặc xóa các phản hồi, bình luận vi phạm chính sách trên hệ thống</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 font-extrabold">
              <th className="p-5 font-bold">Người gửi</th>
              <th className="p-5 font-bold">Nội dung bình luận</th>
              <th className="p-5 font-bold">Bài viết nguồn</th>
              <th className="p-5 font-bold">Thời gian</th>
              <th className="p-5 font-bold">Trạng thái</th>
              <th className="p-5 font-bold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500 font-semibold">Đang tải danh sách bình luận...</td></tr>
            ) : comments.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">Chưa có bình luận nào trên hệ thống</td></tr>
            ) : (
              comments.map((comment) => (
                <tr key={comment.id} className={`border-b border-slate-50 hover:bg-slate-50/30 transition-colors ${comment.is_hidden ? 'bg-slate-50/20' : ''}`}>
                  <td className="p-5 font-semibold text-slate-800">@{comment.author_name}</td>
                  <td className="p-5 text-slate-600 max-w-xs md:max-w-md">
                    <div className="flex flex-col space-y-1">
                      {comment.parent && (
                        <span className="text-[10px] text-blue-500 font-bold flex items-center space-x-1">
                          <CornerDownRight size={10} />
                          <span>Phản hồi @{comment.parent_author}</span>
                        </span>
                      )}
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </td>
                  <td className="p-5">
                    <Link 
                      to={`/article/${comment.article}`} 
                      target="_blank" 
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline max-w-[220px] block truncate"
                      title={comment.article_title}
                    >
                      {comment.article_title || `Xem bài viết #${comment.article}`}
                    </Link>
                  </td>
                  <td className="p-5 text-slate-400 text-xs font-semibold">
                    {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${comment.is_hidden ? 'text-amber-700 bg-amber-50 border border-amber-100' : 'text-emerald-700 bg-emerald-50 border border-emerald-100'}`}>
                      {comment.is_hidden ? 'Đã ẩn' : 'Hiển thị'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => toggleHidden(comment)}
                        className={`p-2 rounded-xl transition-all border ${
                          comment.is_hidden 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                        }`}
                        title={comment.is_hidden ? 'Khôi phục hiển thị' : 'Ẩn bình luận'}
                      >
                        {comment.is_hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(comment.id)} 
                        className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all" 
                        title="Xóa vĩnh viễn"
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
    </div>
  );
}
