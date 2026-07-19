import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useCanvasStore } from './store/canvasStore';
import { AuthPage } from './components/auth/AuthPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { ToastProvider } from './components/ui/Toast';
import { Loader2 } from 'lucide-react';

// Wrapper to handle board loading from URL params
const BoardRouteWrapper = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuthStore();
  const { loadBoard } = useCanvasStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      // Store redirect target URL in sessionStorage to redirect after login
      sessionStorage.setItem('redirect_board_id', boardId || '');
      return;
    }
    if (boardId) {
      loadBoard(boardId);
    }
  }, [boardId, user, loadBoard]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <CanvasViewport onBackToDashboard={() => navigate('/dashboard')} />;
};

// Wrapper for AuthPage redirection
const AuthRouteWrapper = () => {
  const { user } = useAuthStore();
  const redirectBoardId = sessionStorage.getItem('redirect_board_id');

  if (user) {
    if (redirectBoardId) {
      sessionStorage.removeItem('redirect_board_id');
      return <Navigate to={`/board/${redirectBoardId}`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthPage />;
};

// Wrapper for Dashboard navigation
const DashboardRouteWrapper = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Dashboard onOpenBoard={(id) => navigate(`/board/${id}`)} />;
};

function AppContent() {
  const { initAuth, loading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-[#070b13] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <span className="text-xs font-semibold text-slate-400 tracking-wider">Initialising Sandbox...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthRouteWrapper />} />
      <Route path="/dashboard" element={<DashboardRouteWrapper />} />
      <Route path="/board/:boardId" element={<BoardRouteWrapper />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

