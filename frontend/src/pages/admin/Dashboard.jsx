import { useState, useEffect } from 'react';
import { Users, FileText, Eye, MessageSquare, Award, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_articles: 0,
    total_views: 0,
    total_comments: 0,
    recent_articles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('news/dashboard-stats/');
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { name: 'Tổng số Đoàn viên', value: stats.total_users.toLocaleString('vi-VN'), icon: <Users className="text-blue-600" size={24} />, bg: 'bg-blue-50/50 border-blue-100' },
    { name: 'Bài viết đã đăng', value: stats.total_articles.toLocaleString('vi-VN'), icon: <FileText className="text-indigo-600" size={24} />, bg: 'bg-indigo-50/50 border-indigo-100' },
    { name: 'Tổng lượt xem tin', value: stats.total_views.toLocaleString('vi-VN'), icon: <Eye className="text-emerald-600" size={24} />, bg: 'bg-emerald-50/50 border-emerald-100' },
    { name: 'Tổng số bình luận', value: stats.total_comments.toLocaleString('vi-VN'), icon: <MessageSquare className="text-amber-600" size={24} />, bg: 'bg-amber-50/50 border-amber-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-xl">
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Phiên bản Quản trị v1.0</span>
          <h2 className="text-xl md:text-3xl font-black mt-3 md:mt-4 leading-tight">Chào mừng trở lại,<br/> Chi Đoàn Hà Quãng</h2>
          <p className="text-slate-300 text-xs md:text-sm mt-2 md:mt-3 font-semibold">Theo dõi hoạt động, quản lý phong trào đoàn viên Hà Quãng thông qua số liệu trực quan bên dưới.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statItems.map((stat, idx) => (
          <div key={idx} className={`bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border ${stat.bg} shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center space-x-3 md:space-x-5`}>
            <div className="p-2.5 md:p-4 rounded-lg md:rounded-xl bg-white shadow-sm border border-slate-100 shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.name}</p>
              <h3 className="text-lg md:text-2xl font-black text-slate-800 mt-0.5 md:mt-1">{loading ? '...' : stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Articles */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Tin tức nổi bật nhất</h3>
            <Link to="/admin/news" className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center space-x-1">
              <span>Xem chi tiết</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4 flex-1">
            {loading ? (
              <div className="text-slate-400 text-center py-12">Đang tải...</div>
            ) : stats.recent_articles.length === 0 ? (
              <div className="text-slate-400 text-center py-12">Chưa có dữ liệu thống kê bài viết</div>
            ) : (
              stats.recent_articles.map((art) => (
                <div key={art.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/20 px-2 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                    <div className="w-12 h-8 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 flex-shrink-0">
                      {art.image ? (
                        <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <FileText size={16} />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate text-sm">{art.title}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{art.category_name} • {new Date(art.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 md:px-3 py-1 rounded-full whitespace-nowrap shrink-0">{art.views.toLocaleString('vi-VN')} lượt xem</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Simple Activity Chart Placeholder */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Phong trào thanh niên gần đây</h3>
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
            <Award size={48} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Thống kê hoạt động rèn luyện</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">Biểu đồ thống kê tự động các chiến dịch tình nguyện và số lượng đoàn viên tham gia sẽ được cập nhật định kỳ.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
