import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './components/layouts/UserLayout';
import AdminLayout from './components/layouts/AdminLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Home from './pages/user/Home';
import Dashboard from './pages/admin/Dashboard';

import NewsManager from './pages/admin/NewsManager';
import UserManager from './pages/admin/UserManager';
import CommentManager from './pages/admin/CommentManager';
import PollManager from './pages/admin/PollManager';
import ChatManager from './pages/admin/ChatManager';
import IdeaManager from './pages/admin/IdeaManager';

import NewsList from './pages/user/NewsList';
import ArticleDetail from './pages/user/ArticleDetail';
import PollList from './pages/user/PollList';

// Custom PrivateRoute cho Admin
const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('role');
  if (role !== 'ADMIN') {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="news" element={<NewsList />} />
          <Route path="category/:categoryName" element={<NewsList />} />
          <Route path="article/:id" element={<ArticleDetail />} />
          <Route path="polls" element={<PollList />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="news" element={<NewsManager />} />
          <Route path="users" element={<UserManager />} />
          <Route path="comments" element={<CommentManager />} />
          <Route path="polls" element={<PollManager />} />
          <Route path="chat" element={<ChatManager />} />
          <Route path="ideas" element={<IdeaManager />} />
          <Route path="settings" element={<div className="p-4 bg-white rounded shadow">Cài đặt (Sẽ phát triển sau)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
