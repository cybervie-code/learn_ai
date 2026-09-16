import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, ArrowRight, Plus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Assignments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [cohorts, setCohorts] = useState([]);

  const isFaculty = user?.role === 'faculty' || user?.role === 'college-admin';

  useEffect(() => {
    api.listAssignments().then((res) => {
      setAssignments(res.data.data);
      setLoading(false);
    });
    if (isFaculty) {
      api.listQuizzes({ status: 'published' }).then((res) => setQuizzes(res.data.data.quizzes || []));
    }
  }, []);

  if (loading) return <div className="text-subtle p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content flex items-center gap-2">
            <ClipboardList size={24} className="text-cyber-600 dark:text-cyber-400" /> Assignments
          </h1>
          <p className="text-muted mt-1">{isFaculty ? 'Create and track student assignments' : 'Your assigned quizzes and tasks'}</p>
        </div>
        {isFaculty && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
            <Plus size={16} /> New Assignment
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && isFaculty && (
        <CreateAssignmentForm quizzes={quizzes} onClose={() => setShowCreate(false)} onCreated={(a) => { setAssignments([a, ...assignments]); setShowCreate(false); }} />
      )}

      {/* Assignment list */}
      <div className="space-y-3">
        {assignments.map((a) => {
          const due = new Date(a.dueDate);
          const isOverdue = due < new Date() && !a.mySubmission;
          return (
            <div key={a._id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-content">{a.title}</h3>
                  {a.description && <p className="text-sm text-muted mt-1">{a.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-subtle">
                    <span className="flex items-center gap-1"><Clock size={12} /> Due: {due.toLocaleDateString()}</span>
                    {a.cohorts?.length > 0 && <span className="flex items-center gap-1"><Users size={12} /> {a.cohorts.length} cohorts</span>}
                    <span>{a.quiz?.totalQuestions || 0} questions</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {user?.role === 'student' ? (
                    a.mySubmission ? (
                      <span className="badge bg-green-500/15 text-green-600 dark:text-green-400">
                        <CheckCircle2 size={12} /> {a.mySubmission.percentage}%
                      </span>
                    ) : isOverdue ? (
                      <span className="badge bg-red-500/15 text-red-600 dark:text-red-400"><AlertCircle size={12} /> Overdue</span>
                    ) : (
                      <button onClick={() => navigate(`/app/quiz/${a.quiz._id}`)} className="btn-primary text-sm">
                        Start <ArrowRight size={14} />
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-subtle">{a.stats?.totalSubmitted || 0}/{a.stats?.totalAssigned || 0} submitted</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {assignments.length === 0 && (
          <div className="card p-12 text-center text-subtle">No assignments yet.</div>
        )}
      </div>
    </div>
  );
}

function CreateAssignmentForm({ quizzes, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', quiz: '', dueDate: '', targetAllCollege: true });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createAssignment(form);
      onCreated(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-content">Create Assignment</h2>
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div>
        <label className="label">Quiz</label>
        <select className="input" value={form.quiz} onChange={(e) => setForm({ ...form, quiz: e.target.value })} required>
          <option value="">Select a quiz...</option>
          {quizzes.map((q) => <option key={q._id} value={q._id}>{q.title} ({q.totalQuestions} Q)</option>)}
        </select>
      </div>
      <div>
        <label className="label">Due Date</label>
        <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.targetAllCollege} onChange={(e) => setForm({ ...form, targetAllCollege: e.target.checked })} />
        <span className="text-sm text-muted">Assign to all college students</span>
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create'}</button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
