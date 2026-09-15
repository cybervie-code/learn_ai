import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import { Brain, Mail, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Login() {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await api.login(email, password)
        : await api.register({ email, password, name });

      login(res.data.data.user, res.data.data.token);
      toast.success(res.data.message);
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.googleLogin(credentialResponse.credential);
      login(res.data.data.user, res.data.data.token);
      toast.success(res.data.message || 'Signed in with Google');
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed. Try email/password below.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[100px]"></div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-xl">C</div>
          <span className="font-bold text-2xl text-content">Cybervie</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-content text-center mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-muted text-center mb-6">
            {mode === 'login'
              ? 'Sign in to continue your AI learning journey'
              : 'Register to start learning AI and cybersecurity'}
          </p>

          {googleEnabled ? (
            <div className="mb-6">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-in failed. Try email/password below.')}
                  theme={isDark ? 'filled_black' : 'outline'}
                  size="large"
                  width="320"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
              <p className="text-xs text-subtle text-center mt-3">
                Students: sign in with your college Google account if your college is onboarded.
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-lg bg-card border border-border text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-cyber-600 dark:text-cyber-400" />
                <span className="text-sm font-medium text-muted">College Domain Login</span>
              </div>
              <p className="text-xs text-subtle">
                Students sign in with their verified college email (Google Workspace).
                Your college must be registered and domain verified by a superadmin.
              </p>
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-subtle">or use email/password</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@college.ac.in"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-brand-600 dark:text-brand-400 hover:text-brand-300 font-medium"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-card/50 border border-border text-xs text-subtle space-y-1">
          <p className="font-medium text-muted">Demo Credentials:</p>
          <p>Superadmin: admin@cybervie.in / ChangeMe123!</p>
          <p>College Admin: admin@demo.iitd.ac.in / Admin123!</p>
          <p>Faculty: faculty@demo.iitd.ac.in / Faculty123!</p>
          <p>Student: student1@demo.iitd.ac.in / Student123!</p>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1 text-sm text-subtle hover:text-muted mt-6">
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    </div>
  );
}
