import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Trophy, Crown, Medal, Zap, Building2, Flame } from 'lucide-react';

export default function PublicRankings() {
  const [rankings, setRankings] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [tab, setTab] = useState('students');

  useEffect(() => {
    api.getGlobalRankings({ limit: 20 }).then((res) => setRankings(res.data.data.rankings)).catch(() => {});
    api.getCollegeLeaderboard({ limit: 10 }).then((res) => setColleges(res.data.data.rankings)).catch(() => {});
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-600 dark:text-yellow-400" />;
    if (rank === 2) return <Medal size={16} className="text-muted" />;
    if (rank === 3) return <Medal size={16} className="text-orange-600 dark:text-orange-400" />;
    return <span className="text-subtle text-sm font-mono">#{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-content mb-3 flex items-center justify-center gap-2">
          <Trophy size={32} className="text-yellow-600 dark:text-yellow-400" /> Rankings
        </h1>
        <p className="text-muted">Top AI learners across Indian engineering colleges</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('students')} className={tab === 'students' ? 'btn-primary' : 'btn-secondary'}>
          <Zap size={16} /> Students
        </button>
        <button onClick={() => setTab('colleges')} className={tab === 'colleges' ? 'btn-primary' : 'btn-secondary'}>
          <Building2 size={16} /> Colleges
        </button>
      </div>

      {tab === 'students' ? (
        <div className="card overflow-hidden">
          {rankings.map((r) => (
            <div key={r.rank} className="flex items-center gap-4 px-4 py-3 border-b border-border/50 last:border-0">
              <div className="w-10 flex items-center justify-center">{getRankBadge(r.rank)}</div>
              <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold">
                {r.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-content truncate">{r.displayName}</div>
                {r.collegeName && <div className="text-xs text-subtle truncate">{r.collegeName}</div>}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-brand-600 dark:text-brand-400">{r.learningXP} XP</div>
                {r.streak?.current > 0 && <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center justify-end gap-1"><Flame size={10} /> {r.streak.current}</div>}
              </div>
            </div>
          ))}
          {rankings.length === 0 && <div className="p-12 text-center text-subtle">No rankings yet.</div>}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {colleges.map((c) => (
            <div key={c.rank} className="flex items-center gap-4 px-4 py-3 border-b border-border/50 last:border-0">
              <div className="w-10 flex items-center justify-center">{getRankBadge(c.rank)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-content truncate">{c.collegeName}</div>
                <div className="text-xs text-subtle">{c.collegeCity}, {c.collegeState}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-brand-600 dark:text-brand-400">{c.totalXP} XP</div>
                <div className="text-xs text-subtle">{c.activeStudents} students</div>
              </div>
            </div>
          ))}
          {colleges.length === 0 && <div className="p-12 text-center text-subtle">No college rankings yet.</div>}
        </div>
      )}
    </div>
  );
}
