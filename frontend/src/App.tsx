import { useState } from 'react';
import { Routes, Route, Navigate, useMatch } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { DashboardHome } from './pages/DashboardHome';
import BoardView from './pages/BoardView';

// A simple wrapper to protect routes
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const matchBoard = useMatch('/b/:boardId');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar onSearch={setSearchQuery} onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Board Area */}
        <main className="flex-1 overflow-x-auto overflow-y-hidden bg-gradient-to-br from-indigo-50/30 to-purple-50/50">
          {matchBoard ? <BoardView searchQuery={searchQuery} /> : <DashboardHome />}
        </main>
      </div>
    </div>
  );
};

function Application() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
        <Route path="/b/:boardId" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default Application;
