import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, ShieldCheck, KeyRound, User } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo.jsx';

const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const RESEND_SECONDS = 60;

export default function Login() {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // login | register | verify | forgot | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const goVerify = (targetEmail) => {
    setEmail(targetEmail);
    setOtp('');
    setMode('verify');
    setResendIn(RESEND_SECONDS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        login(res.data.data.user, res.data.data.token);
        toast.success(res.data.message);
        navigate('/app');
      } else {
        await api.register({ email, password, name });
        toast.success('Verification code sent to your email');
        goVerify(email);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.details?.requiresVerification) {
        toast.error('Please verify your email to continue');
        api.resendOtp(email, 'verify-email').catch(() => {});
        goVerify(email);
      } else {
        toast.error(data?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.verifyEmail(email, otp);
      login(res.data.data.user, res.data.data.token);
      toast.success(res.data.message || 'Email verified');
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      toast.success('If this email is registered, a reset code has been sent');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('reset');
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email, otp, newPassword);
      toast.success('Password reset successfully. Please sign in.');
      setPassword('');
      setMode('login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      const purpose = mode === 'reset' ? 'reset-password' : 'verify-email';
      await api.resendOtp(email, purpose);
      toast.success('A new code has been sent to your email');
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
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

  const titles = {
    login: 'Welcome Back',
    register: 'Create Account',
    verify: 'Verify Your Email',
    forgot: 'Forgot Password',
    reset: 'Reset Password',
  };

  const subtitles = {
    login: 'Sign in to continue your AI learning journey',
    register: 'Register to start learning AI and cybersecurity',
    verify: `Enter the 6-digit code sent to ${email}`,
    forgot: 'Enter your email and we will send you a reset code',
    reset: `Enter the code sent to ${email} and choose a new password`,
  };

  const resendBlock = (
    <p className="text-center text-sm text-muted mt-4">
      Didn't get the code?{' '}
      <button
        type="button"
        onClick={handleResend}
        disabled={resendIn > 0}
        className="text-brand-600 dark:text-brand-400 hover:text-brand-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
      </button>
    </p>
  );

  const backToLogin = (
    <p className="text-center text-sm text-muted mt-6">
      Remember your password?{' '}
      <button
        type="button"
        onClick={() => setMode('login')}
        className="text-brand-600 dark:text-brand-400 hover:text-brand-300 font-medium"
      >
        Sign in
      </button>
    </p>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[100px]"></div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <BrandLogo className="w-10 h-10" />
          <span className="font-bold text-2xl text-content">Cybervie</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-content text-center mb-2">{titles[mode]}</h1>
          <p className="text-sm text-muted text-center mb-6">{subtitles[mode]}</p>

          {(mode === 'login' || mode === 'register') && (
            <>
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
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input pl-10"
                        placeholder="Your name"
                        required
                      />
                    </div>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-300"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10"
                      placeholder="••••••••"
                      minLength={8}
                      required
                    />
                  </div>
                  {mode === 'register' && (
                    <p className="text-xs text-subtle mt-1">Minimum 8 characters</p>
                  )}
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
            </>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="label">Verification Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input pl-10 tracking-[0.5em] font-mono"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              {resendBlock}
              {backToLogin}
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
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
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
              {backToLogin}
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="label">Reset Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input pl-10 tracking-[0.5em] font-mono"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              {resendBlock}
              {backToLogin}
            </form>
          )}
        </div>

        {(mode === 'login' || mode === 'register') && (
          <div className="mt-6 p-4 rounded-lg bg-card/50 border border-border text-xs text-subtle space-y-1">
            <p className="font-medium text-muted">Demo Credentials:</p>
            <p>Superadmin: admin@cybervie.in / ChangeMe123!</p>
            <p>College Admin: admin@demo.iitd.ac.in / Admin123!</p>
            <p>Faculty: faculty@demo.iitd.ac.in / Faculty123!</p>
            <p>Student: student1@demo.iitd.ac.in / Student123!</p>
          </div>
        )}

        <Link to="/" className="flex items-center justify-center gap-1 text-sm text-subtle hover:text-muted mt-6">
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    </div>
  );
}
