import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Toaster } from 'react-hot-toast';

import PublicLayout from './components/layout/PublicLayout.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

import Home from './pages/public/Home.jsx';
import Login from './pages/public/Login.jsx';
import About from './pages/public/About.jsx';
import PublicPaths from './pages/public/PublicPaths.jsx';
import PublicRankings from './pages/public/PublicRankings.jsx';

import Dashboard from './pages/student/Dashboard.jsx';
import Learn from './pages/student/Learn.jsx';
import MissionDetail from './pages/student/MissionDetail.jsx';
import QuizPlayer from './pages/student/QuizPlayer.jsx';
import Practice from './pages/student/Practice.jsx';
import Rankings from './pages/student/Rankings.jsx';
import Profile from './pages/student/Profile.jsx';
import Assignments from './pages/student/Assignments.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Colleges from './pages/admin/Colleges.jsx';
import Questions from './pages/admin/Questions.jsx';
import Users from './pages/admin/Users.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-subtle">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  const app = (
    <ThemeProvider>
      <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' },
      }} />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/paths" element={<PublicPaths />} />
            <Route path="/rankings" element={<PublicRankings />} />
          </Route>

          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Protected app */}
          <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="learn" element={<Learn />} />
            <Route path="learn/:slug" element={<Learn />} />
            <Route path="learn/mission/:slug" element={<MissionDetail />} />
            <Route path="quiz/:quizId" element={<QuizPlayer />} />
            <Route path="practice" element={<Practice />} />
            <Route path="rankings" element={<Rankings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="colleges" element={<Colleges />} />
            <Route path="questions" element={<Questions />} />
            <Route path="users" element={<Users />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );

  return googleClientId
    ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    : app;
}
