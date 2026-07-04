import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Eye, Search } from 'lucide-react';
import api from '../../api';

export default function NewsList() {
  const { categoryName } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await api.get('news/articles/');
      setArticles(response.data);
    } catch (error) {
      console.error("Failed to fetch articles", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.content.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (categoryName) {
      // So khớp tên chuyên mục từ DB với tên trên URL
      return matchesSearch && art.category_name === categoryName;
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            {categoryName ? `Chuyên mục: ${categoryName}` : 'Tin tức & Hoạt động'}
          </h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">
            {categoryName 
              ? `Xem danh sách tin bài thuộc chuyên mục ${categoryName}` 
              : 'Cập nhật những hoạt động phong trào thanh niên mới nhất'}
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tin bài..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-700"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12 font-semibold">Đang tải tin bài mới nhất...</div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center text-gray-500 py-12 font-semibold">Không tìm thấy tin bài nào trong chuyên mục này</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <Link 
              to={`/article/${article.id}`} 
              key={article.id} 
              className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 bg-slate-50 relative overflow-hidden">
                <img 
                  src={article.image || '/logo-doan-real.png'} 
                  alt={article.title} 
                  className={`w-full h-full transform group-hover:scale-105 transition-transform duration-500 ${article.image ? 'object-cover' : 'object-contain p-6 opacity-30 bg-slate-50'}`}
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm border border-blue-500/10">
                    {article.category_name || 'Tin tức'}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center space-x-3 text-xs text-gray-400 font-semibold mb-2">
                    <span className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>{new Date(article.created_at).toLocaleDateString('vi-VN')}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye size={12} />
                      <span>{article.views} lượt đọc</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                    {article.content}
                  </p>
                </div>
                
                <span className="text-blue-600 font-bold text-xs flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                  <span>Đọc tiếp</span>
                  <span>&rarr;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
