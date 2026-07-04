import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Eye, Send, User, CornerDownRight, X } from 'lucide-react';
import api from '../../api';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState([]);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  
  // Trạng thái trả lời bình luận
  const [replyToId, setReplyToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  
  const isAuthenticated = !!localStorage.getItem('access_token');
  const lastArticleId = useRef(null);

  useEffect(() => {
    fetchArticle();
    
    // Only increment view if we haven't incremented for this specific ID yet on this mount/route-change
    if (lastArticleId.current !== id) {
      lastArticleId.current = id;
      api.post(`news/articles/${id}/increment-view/`).catch(err => console.error(err));
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`news/articles/${id}/`);
      setArticle(response.data);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Failed to fetch article details", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : commentContent;
    if (!content.trim()) return;

    try {
      await api.post('news/comments/', {
        article: id,
        content: content,
        parent: parentId
      });
      
      if (parentId) {
        setReplyContent('');
        setReplyToId(null);
      } else {
        setCommentContent('');
      }
      fetchArticle();
    } catch (error) {
      alert('Không thể đăng bình luận. Vui lòng kiểm tra đăng nhập.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-semibold text-slate-500">Đang tải chi tiết bài viết...</div>;
  }

  if (!article) {
    return (
      <div className="text-center py-20 font-semibold text-slate-500 space-y-4">
        <p>Không tìm thấy bài viết này hoặc bài viết đã bị gỡ bỏ.</p>
        <Link to="/" className="text-blue-600 underline">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      {/* Breadcrumb */}
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <span>/</span>
        <Link to="/news" className="hover:text-blue-600">Tin tức</Link>
        <span>/</span>
        <span className="text-slate-600 truncate max-w-xs">{article.title}</span>
      </div>

      {/* Main Article Card */}
      <article className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-10 space-y-6">
        <div className="space-y-4">
          <span className="bg-blue-50 text-blue-600 px-3.5 py-1.5 rounded-full text-xs font-bold border border-blue-100 w-fit block">
            {article.category_name || 'Tin tức'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 border-b border-slate-100 pb-4">
            <span>Tác giả: {article.author_name}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{new Date(article.created_at).toLocaleDateString('vi-VN')}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Eye size={12} />
              <span>{article.views} lượt đọc</span>
            </span>
          </div>
        </div>

        {/* Main image */}
        {article.image && (
          <div className="w-full h-80 sm:h-[450px] rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Rich content */}
        <div className="text-slate-700 leading-relaxed text-base sm:text-lg whitespace-pre-line space-y-4 pt-4">
          {article.content}
        </div>

        {/* Additional Images Gallery */}
        {article.additional_images && article.additional_images.length > 0 && (
          <div className="pt-8 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Hình ảnh liên quan</h3>
            
            {/* Grid display */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {article.additional_images.map((img, index) => (
                <div 
                  key={img.id} 
                  onClick={() => setSelectedGalleryImage(img.image)}
                  className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-300 bg-slate-55 group"
                >
                  <img 
                    src={img.image} 
                    alt={`Ảnh phụ ${index + 1}`} 
                    className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Comments Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 space-y-8">
        <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <span>Bình luận</span>
        </h3>

        {/* New comment input */}
        {isAuthenticated ? (
          <form onSubmit={(e) => handlePostComment(e, null)} className="flex gap-3 items-start">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold shrink-0">
              <User size={16} />
            </div>
            <div className="flex-1 relative">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Viết ý kiến phản hồi của bạn tại đây..."
                rows={2}
                className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none text-slate-700 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Bạn cần{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Đăng nhập
              </Link>{' '}
              để viết bình luận.
            </p>
          </div>
        )}

        {/* Comment list */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400 font-semibold text-center py-6">Chưa có bình luận nào. Hãy trở thành người đầu tiên tương tác!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-4 border-b border-slate-50 pb-5 last:border-0 last:pb-0">
                {/* Main Comment */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-200/50 rounded-xl flex items-center justify-center text-slate-500 font-bold shrink-0">
                    {comment.author_name ? comment.author_name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">@{comment.author_name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                    
                    {/* Reply triggers */}
                    {isAuthenticated && (
                      <button 
                        onClick={() => {
                          setReplyToId(replyToId === comment.id ? null : comment.id);
                          setReplyContent('');
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline mt-1 block"
                      >
                        Trả lời
                      </button>
                    )}
                  </div>
                </div>

                {/* Nested Replies Rendering */}
                {comment.replies && comment.replies.map((reply) => (
                  <div key={reply.id} className="flex gap-4 items-start pl-10 md:pl-14">
                    <CornerDownRight className="text-slate-300 mt-1 shrink-0" size={16} />
                    <div className="w-8 h-8 bg-slate-50 border border-slate-200/50 rounded-lg flex items-center justify-center text-slate-400 font-bold shrink-0 text-xs">
                      {reply.author_name ? reply.author_name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800">@{reply.author_name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(reply.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{reply.content}</p>
                    </div>
                  </div>
                ))}

                {/* Reply Input Box (Dynamic) */}
                {replyToId === comment.id && (
                  <form onSubmit={(e) => handlePostComment(e, comment.id)} className="flex gap-3 items-start pl-10 md:pl-14">
                    <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold shrink-0 text-xs">
                      R
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Trả lời bình luận của @${comment.author_name}...`}
                        className="w-full pl-4 pr-12 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs font-medium text-slate-700 placeholder:text-slate-400"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition-all"
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedGalleryImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedGalleryImage} 
              alt="Ảnh phóng to" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
            />
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="absolute top-0 right-0 md:-top-12 md:-right-12 bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-full shadow-lg transition-colors border border-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
