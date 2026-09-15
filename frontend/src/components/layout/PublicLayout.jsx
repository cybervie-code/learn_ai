import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '../ThemeToggle.jsx';
import BrandLogo from '../BrandLogo.jsx';

export default function PublicLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-border bg-elevated/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo />
            <span className="font-bold text-xl text-content">Cybervie</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/paths" className="text-sm text-muted hover:text-content transition-colors">Learning Paths</Link>
            <Link to="/rankings" className="text-sm text-muted hover:text-content transition-colors">Rankings</Link>
            <Link to="/about" className="text-sm text-muted hover:text-content transition-colors">About</Link>
            <ThemeToggle />
            {user ? (
              <Link to="/app" className="btn-primary text-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/login" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="btn-ghost p-2" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu size={20} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border p-4 space-y-2">
            <Link to="/paths" className="block text-sm text-muted hover:text-content">Learning Paths</Link>
            <Link to="/rankings" className="block text-sm text-muted hover:text-content">Rankings</Link>
            <Link to="/about" className="block text-sm text-muted hover:text-content">About</Link>
            {user ? (
              <Link to="/app" className="btn-primary w-full text-sm">Dashboard</Link>
            ) : (
              <Link to="/login" className="btn-primary w-full text-sm">Sign In</Link>
            )}
          </div>
        )}
      </header>

      <Outlet />
    </div>
  );
}
