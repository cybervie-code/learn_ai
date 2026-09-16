import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Lock, ArrowLeft, TerminalSquare } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(email, password);
      const user = res.data.data.user;
      if (!user.platformRole) {
        toast.error('This portal is restricted to Cybervie staff accounts.');
        return;
      }
      login(user, res.data.data.token);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-200 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        }}
      ></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[320px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <BrandLogo className="w-10 h-10" />
          <span className="font-bold text-2xl text-white">Cybervie</span>
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Console header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500/70"></span>
              <span className="w-2 h-2 rounded-full bg-amber-500/70"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500/70"></span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
              <TerminalSquare size={12} /> control-plane / auth
            </span>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                <ShieldCheck size={20} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Staff Portal</h1>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-indigo-400">Restricted access</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-7 mt-4 leading-relaxed">
              Platform administration for Cybervie staff. Students and faculty
              should use the <Link to="/login" className="text-indigo-400 hover:text-indigo-300">standard sign-in</Link>.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">Staff email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                    placeholder="admin@cybervie.in"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'Access console'}
              </button>
            </form>

            <p className="font-mono text-[10px] text-slate-600 text-center mt-6 leading-relaxed">
              All sign-in attempts are logged. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-300 mt-6">
          <ArrowLeft size={14} /> Back to site
        </Link>
      </div>
    </div>
  );
}
