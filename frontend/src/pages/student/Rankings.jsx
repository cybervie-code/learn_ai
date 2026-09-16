import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Trophy, Flame, Zap, Building2, Crown, Medal } from 'lucide-react';

export default function Rankings() {
  const [tab, setTab] = useState('global');
  const [rankings, setRankings] = useState([]);
  const [collegeLeaderboard, setCollegeLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === 'global') {
      api.getGlobalRankings({ limit: 50 }).then((res) => {
        setRankings(res.data.data.rankings);
        setLoading(false);
      });
    } else if (tab === 'colleges') {
      api.getCollegeLeaderboard({ limit: 20 }).then((res) => {
        setCollegeLeaderboard(res.data.data.rankings);
        setLoading(false);
      });
    }
  }, [tab]);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-600 dark:text-yellow-400" />;
    if (rank === 2) return <Medal size={16} className="text-muted" />;
    if (rank === 3) return <Medal size={16} className="text-orange-600 dark:text-orange-600 dark:text-orange-400" />;
    return <span className="text-subtle text-sm font-mono">#{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content flex items-center gap-2">
          <Trophy size={24} className="text-yellow-600 dark:text-yellow-400" /> Rankings
        </h1>
        <p className="text-muted mt-1">Compete with students across India</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab('global')}
          className={`${tab === 'global' ? 'btn-primary' : 'btn-secondary'} flex-1 sm:flex-initial text-sm whitespace-nowrap`}
        >
          <Zap size={16} /> Student Leaderboard
        </button>
        <button
          onClick={() => setTab('colleges')}
          className={`${tab === 'colleges' ? 'btn-primary' : 'btn-secondary'} flex-1 sm:flex-initial text-sm whitespace-nowrap`}
        >
          <Building2 size={16} /> College Leaderboard
        </button>
      </div>

      {loading ? (
        <div className="text-subtle p-8 text-center">Loading rankings...</div>
      ) : tab === 'global' ? (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border text-[10px] sm:text-xs font-medium text-subtle uppercase">
            <div className="col-span-1">Rank</div>
            <div className="col-span-7 sm:col-span-5">Student</div>
            <div className="hidden sm:block col-span-3">College</div>
            <div className="col-span-2 text-right">XP</div>
            <div className="col-span-2 sm:col-span-1 text-right">Streak</div>
          </div>
          {rankings.map((r) => (
            <div key={r.rank} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 hover:bg-surface-2/30 items-center">
              <div className="col-span-1 flex items-center justify-center">{getRankBadge(r.rank)}</div>
              <div className="col-span-7 sm:col-span-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-semibold shrink-0">
                  {r.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-content truncate">{r.displayName}</div>
                  {r.branch && <div className="text-xs text-subtle truncate">{r.branch}</div>}
                </div>
              </div>
              <div className="hidden sm:block col-span-3 text-sm text-muted truncate">{r.collegeName || '—'}</div>
              <div className="col-span-2 text-right text-sm font-semibold text-brand-600 dark:text-brand-400">{r.learningXP}</div>
              <div className="col-span-2 sm:col-span-1 text-right flex items-center justify-end gap-1 text-sm text-orange-600 dark:text-orange-400">
                <Flame size={12} /> {r.streak?.current || 0}
              </div>
            </div>
          ))}
          {rankings.length === 0 && <div className="p-8 text-center text-subtle">No rankings yet. Start learning to climb the leaderboard!</div>}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border text-[10px] sm:text-xs font-medium text-subtle uppercase">
            <div className="col-span-1">Rank</div>
            <div className="col-span-7 sm:col-span-4">College</div>
            <div className="hidden sm:block col-span-3">Location</div>
            <div className="col-span-2 text-right">Students</div>
            <div className="col-span-2 text-right">Total XP</div>
          </div>
          {collegeLeaderboard.map((c) => (
            <div key={c.rank} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 hover:bg-surface-2/30 items-center">
              <div className="col-span-1 flex items-center justify-center">{getRankBadge(c.rank)}</div>
              <div className="col-span-7 sm:col-span-4 min-w-0">
                <div className="text-sm font-medium text-content truncate">{c.collegeName}</div>
                {c.collegeShortCode && <div className="text-xs text-subtle">{c.collegeShortCode}</div>}
              </div>
              <div className="hidden sm:block col-span-3 text-sm text-muted truncate">{c.collegeCity}, {c.collegeState}</div>
              <div className="col-span-2 text-right text-sm text-muted">{c.activeStudents}</div>
              <div className="col-span-2 text-right text-sm font-semibold text-brand-600 dark:text-brand-400">{c.totalXP}</div>
            </div>
          ))}
          {collegeLeaderboard.length === 0 && <div className="p-8 text-center text-subtle">No college leaderboard data yet.</div>}
        </div>
      )}
    </div>
  );
}
