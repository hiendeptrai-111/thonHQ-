import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Eye, ArrowRight, Activity, Zap, Heart, X, Lightbulb, Users, Award, Sparkles } from 'lucide-react';
import api from '../../api';
import PollWidget from '../../components/user/PollWidget';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Idea Submission states
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaContent, setIdeaContent] = useState('');
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaSuccess, setIdeaSuccess] = useState('');
  const [ideaError, setIdeaError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get('news/articles/');
        setArticles(response.data);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        setArticles([
          { id: 1, title: 'Đoàn viên thanh niên ra quân Chiến dịch Mùa Hè Xanh 2026 với tinh thần nhiệt huyết', category_name: 'Tình nguyện', views: 342, created_at: '2026-07-02' },
          { id: 2, title: 'Hội thảo: Nâng cao năng lực số và ứng dụng AI cho sinh viên thời đại mới', category_name: 'Sự kiện', views: 185, created_at: '2026-06-28' },
          { id: 3, title: 'Tuyên dương 100 gương mặt trẻ tiêu biểu có thành tích xuất sắc', category_name: 'Tuyên truyền', views: 520, created_at: '2026-06-15' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await api.get('news/notifications/');
        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchArticles();
    fetchNotifications();
  }, []);

  const handleNotificationClick = (item) => {
    setSelectedNotification(item);
    
    // Add item id to read notifications in localStorage
    const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    if (!readIds.includes(item.id)) {
      readIds.push(item.id);
      localStorage.setItem('read_notifications', JSON.stringify(readIds));
      
      // Dispatch storage event to alert UserLayout.jsx immediately
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleOpenIdeaModal = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Bạn cần đăng nhập để gửi ý tưởng sáng tạo đóng góp cho phong trào Đoàn.');
      navigate('/login');
      return;
    }
    setIdeaTitle('');
    setIdeaContent('');
    setIdeaError('');
    setIdeaSuccess('');
    setIsIdeaModalOpen(true);
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    if (!ideaTitle.trim() || !ideaContent.trim()) {
      setIdeaError('Vui lòng điền đầy đủ tiêu đề và nội dung đề xuất.');
      return;
    }
    setIdeaLoading(true);
    setIdeaError('');
    setIdeaSuccess('');
    try {
      await api.post('news/ideas/', {
        title: ideaTitle,
        content: ideaContent
      });
      setIdeaSuccess('Gửi ý tưởng thành công! Cảm ơn đóng góp sáng kiến của bạn cho Đoàn thôn.');
      setTimeout(() => {
        setIsIdeaModalOpen(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setIdeaError('Đã xảy ra lỗi khi gửi ý tưởng. Vui lòng thử lại sau.');
    } finally {
      setIdeaLoading(false);
    }
  };

  return (
    <div className="space-y-16 pb-12 font-sans overflow-x-hidden">
      {/* Self-contained CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.08); }
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(15deg); }
        }
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.1; }
          50% { transform: translate(100px, -50px) scale(1.3); opacity: 0.25; }
          100% { transform: translate(200px, 0) scale(1); opacity: 0.1; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .anim-float-slow-1 { animation: floatSlow 8s ease-in-out infinite; }
        .anim-float-slow-2 { animation: floatSlow 12s ease-in-out infinite 2s; }
        .anim-float-slow-3 { animation: floatSlow 10s ease-in-out infinite 4s; }
        .anim-float-fast { animation: floatFast 4s ease-in-out infinite; }
        .anim-drift-1 { animation: drift 15s ease-in-out infinite; }
        .anim-drift-2 { animation: drift 20s ease-in-out infinite 5s; }
        .anim-spin-slow { animation: spinSlow 20s linear infinite; }
        .card-premium-glow:hover {
          box-shadow: 0 20px 40px -15px rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.25);
        }
        .glow-blue-subtle {
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.08);
        }
      `}} />

      {/* Hero Banner Section */}
      <section className="relative w-full h-[450px] md:h-[560px] overflow-hidden bg-slate-950 rounded-b-[2.5rem] md:rounded-[3rem] shadow-2xl mx-auto max-w-7xl mt-0 md:mt-6">
        {/* Animated Background Gradients & Glows */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/banner.png" 
            alt="Đoàn Thanh Niên Banner" 
            className="w-full h-full object-cover object-center opacity-75 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/10 to-transparent"></div>
          
          {/* Glowing Drift Particles */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl anim-drift-1"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl anim-drift-2"></div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-20 max-w-4xl">
          <div className="space-y-4">
            <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4.5 py-2 rounded-full text-[11px] font-black tracking-widest uppercase mb-2 shadow-lg shadow-blue-500/20 backdrop-blur-sm border border-blue-400/20 w-fit">
              <Sparkles size={14} className="text-yellow-300 animate-pulse" />
              <span>Đoàn Thôn Hà Quảng Đông</span>
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-xl">
              Khát Vọng Trẻ,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                Vươn Tầm Sáng Tạo
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-200/90 max-w-2xl font-medium leading-relaxed drop-shadow-md">
              Môi trường kết nối nhiệt huyết, phát huy sức mạnh chuyển đổi số và tinh thần xung kích của thế hệ thanh niên tiên phong.
            </p>
            <div className="flex flex-wrap gap-4 pt-6">
              <button 
                onClick={handleOpenIdeaModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/35 flex items-center space-x-2 group cursor-pointer hover:-translate-y-0.5"
              >
                <span>Gửi Ý Tưởng Ngay</span>
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
              <Link
                to="/news"
                className="bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/35 backdrop-blur-md px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center cursor-pointer"
              >
                Xem Hoạt Động
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Floating Icon */}
        <div className="absolute right-12 top-16 hidden lg:block z-10 opacity-20 hover:opacity-40 transition-opacity">
          <Award size={180} className="text-white anim-float-slow-1" />
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Dynamic Youth Stats Dashboard (WOW element) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Bảng số liệu thời gian thực</h2>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1.5">Sức Mạnh Đoàn Viên Số</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: 'Đoàn viên tích cực', 
                value: '1,250+', 
                sub: '+15 đoàn viên mới tháng này', 
                pct: '92%', 
                color: 'text-blue-600', 
                bg: 'bg-blue-500/5', 
                border: 'border-blue-100/80',
                icon: <Users size={22} className="text-blue-600" /> 
              },
              { 
                title: 'Chiến dịch hành động', 
                value: '48+', 
                sub: 'Hoàn thành 100% chỉ tiêu', 
                pct: '100%', 
                color: 'text-emerald-600', 
                bg: 'bg-emerald-500/5', 
                border: 'border-emerald-100/80',
                icon: <Activity size={22} className="text-emerald-600" /> 
              },
              { 
                title: 'Ý tưởng sáng tạo', 
                value: '85+', 
                sub: '6 đề xuất đang được ấp ủ', 
                pct: '76%', 
                color: 'text-indigo-600', 
                bg: 'bg-indigo-500/5', 
                border: 'border-indigo-100/80',
                icon: <Lightbulb size={22} className="text-indigo-600" /> 
              },
              { 
                title: 'Lượt tham gia tương tác', 
                value: '2,450+', 
                sub: 'Bình chọn và đóng góp ý kiến', 
                pct: '85%', 
                color: 'text-rose-600', 
                bg: 'bg-rose-500/5', 
                border: 'border-rose-100/80',
                icon: <Zap size={22} className="text-rose-600" /> 
              },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`bg-white p-6 rounded-3xl border ${item.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group`}
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className={`p-3 rounded-2xl ${item.bg} w-fit`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">{item.pct}</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 leading-none">{item.value}</h4>
                    <p className="text-[11px] font-bold text-slate-700 mt-2">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.sub}</p>
                  </div>
                  {/* Decorative progress micro-bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-emerald-500' : idx === 2 ? 'bg-indigo-500' : 'bg-rose-500'
                      }`}
                      style={{ width: item.pct }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic content Section (News & Widget) */}
        <div className="flex flex-col lg:flex-row gap-12 pt-4">
          
          {/* News Feed Section (Left) */}
          <div className="lg:w-2/3 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Bản tin nhanh</span>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">Tin tức & Sự kiện nổi bật</h2>
              </div>
              <Link 
                to="/news" 
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 group cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {articles.map((article) => (
                  <Link 
                    to={`/article/${article.id}`} 
                    key={article.id} 
                    className="group block bg-white rounded-3xl p-5 border border-slate-100 card-premium-glow hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row gap-6 relative z-10">
                      <div className="md:w-1/3 h-48 md:h-36 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden relative shrink-0">
                        <img 
                          src={article.image || '/logo-doan-real.png'} 
                          alt={article.title} 
                          className={`w-full h-full transform group-hover:scale-105 transition-transform duration-500 ${article.image ? 'object-cover' : 'object-contain p-4 opacity-40 bg-slate-50'}`}
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/95 backdrop-blur-sm text-blue-600 text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-100">
                            {article.category_name || 'Tin tức'}
                          </span>
                        </div>
                      </div>
                      <div className="md:w-2/3 flex flex-col justify-center space-y-2">
                        <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-400">
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
                        <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-450 font-semibold line-clamp-2 leading-relaxed">
                          {article.content}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Sidebar Section (Right) */}
          <div className="lg:w-1/3 space-y-8">
            
            {/* Interactive Creative Corner card */}
            <div className="bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-white/5 group hover:shadow-blue-900/10 transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl anim-spin-slow"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-yellow-300 anim-float-fast shadow-inner">
                    <Lightbulb size={24} className="fill-yellow-300/20" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest text-blue-200 bg-white/10 px-2.5 py-1 rounded-full uppercase border border-white/5">Sáng kiến</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black">Góc Sáng Tạo</h3>
                  <p className="text-slate-300 text-xs font-semibold leading-relaxed">
                    Bạn có ý tưởng hoặc đề xuất đột phá nào cho phong trào Đoàn sắp tới không? Hãy chia sẻ sáng kiến của bạn để cùng xây dựng cộng đồng vững mạnh!
                  </p>
                </div>
                <button 
                  onClick={handleOpenIdeaModal}
                  className="w-full bg-white hover:bg-slate-50 text-slate-900 font-extrabold py-3.5 px-4 rounded-2xl shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider hover:shadow-xl active:scale-98"
                >
                  Gửi ý tưởng ngay
                </button>
              </div>
            </div>

            {/* Poll Widget */}
            <div className="glow-blue-subtle rounded-3xl overflow-hidden">
              <PollWidget />
            </div>

            {/* Notifications Box */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center space-x-2 pb-1 border-b border-slate-50">
                <span className="w-1.5 h-4.5 bg-blue-600 rounded-full"></span>
                <span>Thông báo quan trọng</span>
              </h3>
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-4">Chưa có thông báo nào mới</p>
              ) : (
                <ul className="space-y-4">
                  {notifications.slice(0, 3).map((item) => (
                    <li 
                      key={item.id} 
                      onClick={() => handleNotificationClick(item)}
                      className="flex space-x-3 items-start group cursor-pointer"
                    >
                      <div className="mt-1.5 w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-blue-600 transition-colors shrink-0"></div>
                      <div className="space-y-1">
                        <p className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">{item.title}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">{selectedNotification.title}</h3>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Gửi ngày: {new Date(selectedNotification.created_at).toLocaleString('vi-VN')}
            </p>
            <div className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap">
              {selectedNotification.content}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
              >
                Đóng
              </button>
              {selectedNotification.target_url && (
                <Link
                  to={selectedNotification.target_url}
                  onClick={() => setSelectedNotification(null)}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10"
                >
                  Xem chi tiết
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Idea Submission Modal */}
      {isIdeaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Lightbulb size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">Gửi ý tưởng đóng góp phong trào</h3>
              </div>
              <button 
                onClick={() => setIsIdeaModalOpen(false)}
                className="text-gray-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {ideaError && <div className="text-red-650 text-xs font-semibold bg-red-50 border border-red-100 p-3 rounded-2xl text-center">{ideaError}</div>}
            {ideaSuccess && <div className="text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">{ideaSuccess}</div>}

            <form onSubmit={handleSubmitIdea} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tiêu đề ý tưởng / Đề xuất</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tổ chức giải bóng đá nam thanh niên năm 2026..."
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mô tả nội dung chi tiết sáng kiến</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Hãy mô tả chi tiết ý tưởng của bạn: Mục đích, nội dung thực hiện, đối tượng tham gia và kết quả mong đợi..."
                  value={ideaContent}
                  onChange={(e) => setIdeaContent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-xs font-semibold text-slate-800 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIdeaModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={ideaLoading}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 flex items-center space-x-1.5"
                >
                  <span>{ideaLoading ? 'Đang gửi...' : 'Gửi đề xuất'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
