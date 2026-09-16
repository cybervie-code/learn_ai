import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  User, Zap, Flame, Trophy, BookOpen, CheckCircle2,
  TrendingUp, Edit3, Save, Award, Building2, Mail,
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.getMyProfile().then((res) => {
      setProfile(res.data.data);
      setForm({
        name: res.data.data.name || '',
        bio: res.data.data.bio || '',
        headline: res.data.data.headline || '',
        branch: res.data.data.branch || '',
        graduationYear: res.data.data.graduationYear || '',
        isProfilePublic: res.data.data.isProfilePublic || false,
        publicDisplayName: res.data.data.publicDisplayName || '',
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    try {
      const res = await api.updateMyProfile(form);
      setProfile(res.data.data);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-brand-600/10 to-brand-600/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-2xl font-bold shrink-0">
              {profile.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-content break-words">{profile.name}</h1>
              {profile.headline && <p className="text-muted mt-1">{profile.headline}</p>}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-subtle">
                {profile.college && <span className="flex items-center gap-1"><Building2 size={12} /> {profile.college.name}</span>}
                {profile.branch && <span>• {profile.branch}</span>}
                {profile.graduationYear && <span>• {profile.graduationYear}</span>}
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="btn-secondary shrink-0">
            {editing ? 'Cancel' : <><Edit3 size={14} /> Edit</>}
          </button>
        </div>

        {profile.bio && !editing && <p className="text-muted mt-4">{profile.bio}</p>}

        {isStudent && profile.isProfilePublic && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
            <CheckCircle2 size={12} /> Public Profile Active
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-content">Edit Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Headline</label>
              <input className="input" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. AI Enthusiast | CSE Student" />
            </div>
            {isStudent && (
              <>
                <div>
                  <label className="label">Branch</label>
                  <input className="input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
                </div>
                <div>
                  <label className="label">Graduation Year</label>
                  <input type="number" className="input" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." />
          </div>
          {isStudent && (
            <>
              <div>
                <label className="label">Public Display Name</label>
                <input className="input" value={form.publicDisplayName} onChange={(e) => setForm({ ...form, publicDisplayName: e.target.value })} placeholder="Name shown on public profile" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isProfilePublic} onChange={(e) => setForm({ ...form, isProfilePublic: e.target.checked })} className="rounded" />
                <span className="text-sm text-muted">Make my profile public (visible in rankings)</span>
              </label>
            </>
          )}
          <button onClick={handleSave} className="btn-primary">
            <Save size={14} /> Save Changes
          </button>
        </div>
      )}

      {/* Learning stats — student accounts only */}
      {isStudent && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Learning XP', value: profile.learningXP || 0, icon: Zap, color: 'text-brand-600 dark:text-brand-400' },
          { label: 'Day Streak', value: profile.streak?.current || 0, icon: Flame, color: 'text-orange-600 dark:text-orange-400' },
          { label: 'Quizzes Done', value: profile.stats?.totalQuizzes || 0, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
          { label: 'Avg Score', value: `${profile.stats?.averageScore || 0}%`, icon: TrendingUp, color: 'text-cyber-600 dark:text-cyber-400' },
        ].map((s, i) => (
          <div key={i} className="card p-5">
            <s.icon size={20} className={s.color} />
            <div className="text-2xl font-bold text-content mt-2">{s.value}</div>
            <div className="text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      )}

      {/* Recent attempts */}
      {isStudent && profile.recentAttempts?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-content mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-brand-600 dark:text-brand-400" /> Recent Activity
          </h2>
          <div className="space-y-2">
            {profile.recentAttempts.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-content truncate">{a.quizTitle}</div>
                  <div className="text-xs text-subtle">{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm text-muted">{a.correctCount}/{a.totalPoints / 10}</span>
                  <span className={`text-sm font-semibold ${a.percentage >= 60 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {a.percentage}%
                  </span>
                  {a.xpAwarded > 0 && <span className="text-xs text-brand-600 dark:text-brand-400">+{a.xpAwarded} XP</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {isStudent && profile.badges?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-content mb-4 flex items-center gap-2">
            <Award size={18} className="text-yellow-600 dark:text-yellow-400" /> Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.badges.map((b, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-border-strong">
                <span className="text-xl">{b.icon}</span>
                <div>
                  <div className="text-sm font-medium text-content">{b.name}</div>
                  <div className="text-xs text-subtle">{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
