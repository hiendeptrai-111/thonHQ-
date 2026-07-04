import { useState, useEffect } from 'react';
import { UserX, UserCheck, Shield, Users, Search } from 'lucide-react';
import api from '../../api';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('auth/admin/users/');
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.patch(`auth/admin/users/${user.id}/`, { is_active: !user.is_active });
      fetchUsers();
    } catch (error) {
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.last_name || ''} ${user.first_name || ''}`.toLowerCase();
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const branch = (user.branch || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return fullName.includes(search) || 
           username.includes(search) || 
           email.includes(search) ||
           branch.includes(search);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <span>Quản lý Người dùng</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Quản lý tài khoản đoàn viên, thanh niên và phân quyền hệ thống</p>
        </div>
        
        {/* Modern Search bar */}
        <div className="relative max-w-xs w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đoàn viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold placeholder:text-slate-400 text-slate-700"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 font-extrabold">
              <th className="p-5 font-bold">Thành viên</th>
              <th className="p-5 font-bold">Tài khoản</th>
              <th className="p-5 font-bold">Đơn vị / Chi đoàn</th>
              <th className="p-5 font-bold">Phân quyền</th>
              <th className="p-5 font-bold">Trạng thái</th>
              <th className="p-5 font-bold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500 font-semibold">Đang tải danh sách thành viên...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">Không tìm thấy người dùng phù hợp</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-extrabold text-sm border border-blue-100">
                        {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 leading-snug">{user.last_name} {user.first_name}</span>
                        <span className="text-xs text-slate-400 mt-0.5">{user.email || 'Chưa cập nhật email'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-sm font-semibold text-slate-700">@{user.username}</td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">{user.branch || 'N/A'}</span>
                      <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user.department || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit space-x-1 border ${user.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {user.role === 'ADMIN' && <Shield size={12} />}
                      <span>{user.role === 'ADMIN' ? 'BCH Đoàn' : 'Đoàn viên'}</span>
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.is_active ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-700 bg-rose-50 border border-rose-100'}`}>
                      {user.is_active ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td className="p-5">
                    <button 
                      onClick={() => toggleActive(user)}
                      className={`p-2 rounded-xl transition-all duration-200 border ${
                        user.is_active 
                          ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                      }`}
                      title={user.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {user.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                    </button>
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
