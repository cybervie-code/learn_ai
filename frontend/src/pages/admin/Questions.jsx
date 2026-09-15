import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  FileQuestion, Plus, Search, Edit3, Trash2, X, CheckCircle2, Clock,
} from 'lucide-react';

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = () => {
    api.listQuestions({ search, status: statusFilter, page, limit: 20 }).then((res) => {
      setQuestions(res.data.data.questions);
      setTotal(res.data.data.total);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [search, statusFilter, page]);

  const statusColors = {
    draft: 'bg-gray-500/15 text-muted',
    'technical-review': 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    'pedagogical-review': 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    'language-review': 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    approved: 'bg-cyber-500/15 text-cyber-600 dark:text-cyber-400',
    published: 'bg-green-500/15 text-green-600 dark:text-green-400',
    retired: 'bg-red-500/15 text-red-600 dark:text-red-400',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content flex items-center gap-2">
            <FileQuestion size={24} className="text-cyber-600 dark:text-cyber-400" /> Question Bank
          </h1>
          <p className="text-muted mt-1">Create and manage quiz questions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New Question
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input className="input pl-10" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="technical-review">In Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      <div className="space-y-3">
        {questions.map((q) => {
          const v = q.versions[q.versions.length - 1];
          return (
            <div key={q._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-content line-clamp-2">{v?.questionText}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-subtle">
                    <span className={`badge ${statusColors[q.status] || 'bg-gray-500/15 text-muted'}`}>{q.status}</span>
                    <span className={`badge-${q.difficulty}`}>{q.difficulty}</span>
                    <span>{q.topic}</span>
                    <span>v{q.currentVersion}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toast('Edit not implemented in MVP')} className="btn-ghost p-2"><Edit3 size={14} /></button>
                  <button onClick={async () => { if (confirm('Retire this question?')) { await api.deleteQuestion(q._id); toast.success('Retired'); load(); } }} className="btn-ghost p-2 text-red-600 dark:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              {q.status === 'draft' && (
                <button
                  onClick={async () => { try { await api.updateQuestionStatus(q._id, 'technical-review'); toast.success('Sent for review'); load(); } catch (err) { toast.error(err.response?.data?.message); } }}
                  className="btn-secondary text-xs mt-3"
                >
                  Send for Review
                </button>
              )}
              {q.status === 'approved' && (
                <button
                  onClick={async () => { try { await api.updateQuestionStatus(q._id, 'published'); toast.success('Published'); load(); } catch (err) { toast.error(err.response?.data?.message); } }}
                  className="btn-primary text-xs mt-3"
                >
                  <CheckCircle2 size={12} /> Publish
                </button>
              )}
            </div>
          );
        })}
      </div>

      {loading && <div className="text-subtle p-8 text-center">Loading...</div>}
      {!loading && questions.length === 0 && <div className="card p-12 text-center text-subtle">No questions found.</div>}

      {showCreate && <CreateQuestionForm onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function CreateQuestionForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    questionText: '', explanation: '', scenario: '',
    difficulty: 'medium', track: 'foundation', topic: '',
    options: [
      { key: 'A', text: '', isCorrect: false, explanation: '' },
      { key: 'B', text: '', isCorrect: false, explanation: '' },
      { key: 'C', text: '', isCorrect: false, explanation: '' },
      { key: 'D', text: '', isCorrect: false, explanation: '' },
    ],
  });
  const [loading, setLoading] = useState(false);

  const updateOption = (i, field, value) => {
    const options = [...form.options];
    options[i] = { ...options[i], [field]: value };
    setForm({ ...form, options });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.options.some((o) => o.isCorrect)) { toast.error('Mark at least one correct option'); return; }
    if (form.options.some((o) => !o.text.trim())) { toast.error('Fill all option texts'); return; }
    setLoading(true);
    try {
      await api.createQuestion(form);
      toast.success('Question created');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create question');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <form className="card p-6 max-w-2xl w-full space-y-4 my-8" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content">Create Question</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-subtle" /></button>
        </div>

        <div><label className="label">Question Text</label><textarea className="input" rows={3} value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} required /></div>

        <div><label className="label">Scenario (optional)</label><textarea className="input" rows={2} value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} /></div>

        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Difficulty</label>
            <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="expert">Expert</option>
            </select>
          </div>
          <div><label className="label">Track</label>
            <select className="input" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
              <option value="foundation">Foundation</option><option value="technical">Technical</option><option value="applied">Applied</option><option value="ai-security">AI Security</option>
            </select>
          </div>
          <div><label className="label">Topic</label><input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
        </div>

        <div>
          <label className="label">Options (select the correct one)</label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => updateOption(i, 'isCorrect', !opt.isCorrect)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-1 ${opt.isCorrect ? 'bg-green-500 text-white' : 'bg-surface-2 text-muted border border-border-strong'}`}
                >
                  {opt.isCorrect ? '✓' : opt.key}
                </button>
                <input className="input" placeholder={`Option ${opt.key}`} value={opt.text} onChange={(e) => updateOption(i, 'text', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div><label className="label">Explanation (shown after answering)</label><textarea className="input" rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} /></div>

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Creating...' : 'Create Question'}</button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
