import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Eye, EyeOff, X, Image as ImageIcon } from 'lucide-react';
import api from '../../api';

export default function NewsManager() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    is_pinned: false,
    is_published: true,
    slug: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // States for multiple additional images
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [clearExistingImages, setClearExistingImages] = useState(false);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await api.get('news/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await api.delete(`news/articles/${id}/`);
        fetchArticles();
      } catch (error) {
        alert('Lỗi khi xóa bài viết');
      }
    }
  };

  const togglePublish = async (article) => {
    try {
      await api.patch(`news/articles/${article.id}/`, { is_published: !article.is_published });
      fetchArticles();
    } catch (error) {
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  const openAddModal = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      content: '',
      category: categories[0]?.id || '',
      is_pinned: false,
      is_published: true,
      send_notification: false,
      slug: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setAdditionalFiles([]);
    setAdditionalPreviews([]);
    setClearExistingImages(false);
    setIsModalOpen(true);
  };

  const openEditModal = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      is_pinned: article.is_pinned,
      is_published: article.is_published,
      send_notification: false,
      slug: article.slug || ''
    });
    setImageFile(null);
    setImagePreview(article.image || null);
    setAdditionalFiles([]);
    setAdditionalPreviews([]);
    setClearExistingImages(false);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAdditionalFiles(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAdditionalPreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveAdditionalImage = (index) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
    setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('category', formData.category);
      data.append('is_pinned', formData.is_pinned);
      data.append('is_published', formData.is_published);
      data.append('send_notification', formData.send_notification);
      
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      data.append('slug', slug);

      if (imageFile) {
        data.append('image', imageFile);
      }

      additionalFiles.forEach((file) => {
        data.append('additional_images', file);
      });

      if (editingArticle && clearExistingImages) {
        data.append('clear_existing_images', 'true');
      }

      if (editingArticle) {
        await api.put(`news/articles/${editingArticle.id}/`, data);
      } else {
        await api.post('news/articles/', data);
      }
      setIsModalOpen(false);
      fetchArticles();
    } catch (error) {
      console.error("Failed to save article", error);
      alert('Lỗi khi lưu bài viết. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white/50">
        <div className="flex flex-col">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">Quản lý Tin tức</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Tạo, sửa đổi và kiểm soát xuất bản các tin bài</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transform hover:-translate-y-0.5 text-sm"
        >
          <Plus size={18} />
          <span>Thêm bài viết mới</span>
        </button>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 font-extrabold">
              <th className="p-5 font-bold">Hình ảnh</th>
              <th className="p-5 font-bold">Tiêu đề bài viết</th>
              <th className="p-5 font-bold">Chuyên mục</th>
              <th className="p-5 font-bold">Tác giả</th>
              <th className="p-5 font-bold">Ghim</th>
              <th className="p-5 font-bold">Trạng thái</th>
              <th className="p-5 font-bold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-500 font-semibold">Đang tải danh sách bài viết...</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-500">Chưa có bài viết nào được đăng tải</td></tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <td className="p-5">
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shadow-sm">
                      {article.image ? (
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col max-w-sm">
                      <span className="text-sm font-semibold text-slate-900 truncate leading-snug">{article.title}</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1">ID: #{article.id} • {new Date(article.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                      {article.category_name}
                    </span>
                  </td>
                  <td className="p-5 text-sm font-semibold text-slate-600">{article.author_name}</td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${article.is_pinned ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                      {article.is_pinned ? 'Đã ghim' : 'Không'}
                    </span>
                  </td>
                  <td className="p-5">
                    <button 
                      onClick={() => togglePublish(article)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${article.is_published ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-slate-500 bg-slate-100 border-slate-200'}`}
                    >
                      {article.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{article.is_published ? 'Đã xuất bản' : 'Đang ẩn'}</span>
                    </button>
                  </td>
                  <td className="p-5">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openEditModal(article)}
                        className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200" 
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(article.id)} 
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all duration-200" 
                        title="Xóa bài viết"
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

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 text-center text-slate-500 font-semibold">Đang tải danh sách bài viết...</div>
        ) : articles.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Chưa có bài viết nào được đăng tải</div>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="p-4 flex flex-col space-y-3">
              <div className="flex space-x-3 items-start">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shadow-sm shrink-0">
                  {article.image ? (
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{article.title}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">ID: #{article.id} • {new Date(article.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-100">
                  {article.category_name}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Tác giả: {article.author_name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${article.is_pinned ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                  {article.is_pinned ? 'Đã ghim' : 'Không ghim'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <button 
                  onClick={() => togglePublish(article)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${article.is_published ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}
                >
                  {article.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{article.is_published ? 'Đã xuất bản' : 'Đang ẩn'}</span>
                </button>

                <div className="flex space-x-1.5">
                  <button 
                    onClick={() => openEditModal(article)}
                    className="text-blue-600 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all duration-200" 
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(article.id)} 
                    className="text-red-500 p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-all duration-200" 
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[95vh] md:max-h-[90vh] mx-2 md:mx-0">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingArticle ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Vui lòng hoàn thành các trường thông tin bên dưới</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tiêu đề bài viết</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề tin tức..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Chuyên mục</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white font-semibold text-slate-700"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Đường dẫn tĩnh (Slug)</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="Tự động tạo nếu để trống..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Upload Image Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Hình ảnh bài viết</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-3xl hover:border-blue-500 transition-colors bg-slate-50/50">
                  <div className="space-y-2 text-center flex flex-col items-center">
                    {imagePreview ? (
                      <div className="relative w-full max-w-xs h-32 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white p-1">
                        <img src={imagePreview} alt="Xem trước" className="w-full h-full object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm text-slate-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-bold text-blue-600 hover:text-blue-500 focus-within:outline-none">
                            <span>Tải ảnh lên</span>
                            <input type="file" name="image" className="sr-only" accept="image/*" onChange={handleImageChange} />
                          </label>
                          <p className="pl-1">hoặc kéo thả</p>
                        </div>
                        <p className="text-xs text-slate-400">PNG, JPG, GIF tối đa 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Images Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Hình ảnh bổ sung (Tải lên nhiều ảnh)</label>
                <div className="mt-1 flex flex-col space-y-4 p-5 border-2 border-slate-200 border-dashed rounded-3xl bg-slate-50/50 hover:border-blue-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10">
                      <span>Chọn nhiều ảnh</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="sr-only" 
                        onChange={handleAdditionalImagesChange} 
                      />
                    </label>
                    {editingArticle && editingArticle.additional_images?.length > 0 && !clearExistingImages && (
                      <button
                        type="button"
                        onClick={() => setClearExistingImages(true)}
                        className="text-red-500 hover:text-red-650 text-xs font-bold"
                      >
                        Xóa toàn bộ ảnh phụ cũ
                      </button>
                    )}
                  </div>

                  {/* Previews grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {/* Existing Images Previews (if editing and not cleared) */}
                    {editingArticle && !clearExistingImages && editingArticle.additional_images?.map((img) => (
                      <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                        <img src={img.image} alt="Ảnh cũ" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-slate-900/60 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Ảnh cũ</span>
                      </div>
                    ))}

                    {/* New Images Previews */}
                    {additionalPreviews.map((preview, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                        <img src={preview} alt="Xem trước ảnh phụ" className="w-full h-full object-cover animate-fade-in" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalImage(idx)}
                          className="absolute top-1.5 right-1.5 bg-red-500/80 hover:bg-red-600/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nội dung bài viết</label>
                <textarea
                  name="content"
                  required
                  rows={8}
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung chi tiết bài viết..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-6 pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="is_pinned"
                    checked={formData.is_pinned}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-slate-200 rounded-lg focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Ghim bài viết nổi bật</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-slate-200 rounded-lg focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Xuất bản bài viết</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="send_notification"
                    checked={formData.send_notification}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-slate-200 rounded-lg focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-blue-600 font-bold">Gửi thông báo đến đoàn viên</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10"
                >
                  Lưu bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
