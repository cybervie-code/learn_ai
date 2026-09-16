import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users as UsersIcon, Search, Ban, CheckCircle2, UserPlus, X, Mail } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'faculty', label: 'Faculty' },
  { value: 'department-admin', label: 'Department Admin' },
  { value: 'placement-officer', label: 'Placement Officer' },
  { value: 'student', label: 'Student' },
  { value: 'college-admin', label: 'College Admin' },
];

const ROLE_FILTERS = ['student', 'faculty', 'department-admin', 'placement-officer', 'college-admin'];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'faculty', collegeId: '' });

  const isSuperadmin = Boolean(currentUser?.platformRole);
  const isOwner = currentUser?.role === 'college-owner';
  // Who can create/manage: platform staff or college admins/owners. Faculty get read-only.
  const canManage = isSuperadmin || ['college-admin', 'college-owner'].includes(currentUser?.role);
  // College admins (non-owners) cannot create another college-admin
  const roleOptions = isSuperadmin || isOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== 'college-admin');

  const load = () => {
    const fn = isSuperadmin ? api.listAllUsers : api.listCollegeUsers;
    const params = { search, limit: 50 };
    if (roleFilter) params.role = roleFilter;
    if (isSuperadmin && collegeFilter) params.college = collegeFilter;
    fn(params).then((res) => {
      setUsers(res.data.data.users);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, roleFilter, collegeFilter]);

  useEffect(() => {
    if (isSuperadmin) {
      api.listColleges({ limit: 100 }).then((res) => {
        setColleges(res.data.data.colleges || []);
      }).catch(() => {});
    }
  }, [isSuperadmin]);

  // Students have no business on this screen — bounce them home
  if (currentUser?.role === 'student' && !currentUser?.platformRole) {
    return <Navigate to="/app" replace />;
  }

  const toggleStatus = async (u) => {
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(u._id, newStatus);
      toast.success(`User ${newStatus}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (isSuperadmin) payload.collegeId = form.collegeId;
      const res = await api.createUser(payload);
      toast.success(res.data.message || 'User invited');
      setShowCreate(false);
      setForm({ name: '', email: '', role: 'faculty', collegeId: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content flex items-center gap-2">
            <UsersIcon size={24} className="text-brand-600 dark:text-brand-400" /> {isSuperadmin ? 'All Users' : 'College Users'}
          </h1>
          <p className="text-muted mt-1">Manage user accounts and roles</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate((s) => !s)} className="btn-primary text-sm shrink-0">
            {showCreate ? <X size={16} /> : <UserPlus size={16} />}
            {showCreate ? 'Close' : 'Add user'}
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card p-5">
          <h2 className="font-semibold text-content mb-1">Invite a new member</h2>
          <p className="text-xs text-subtle mb-5 flex items-center gap-1.5">
            <Mail size={12} /> They'll receive an email with a one-click link to set their own password.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                placeholder="Prof. Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="faculty@college.ac.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {isSuperadmin && (
              <div>
                <label className="label">College</label>
                <select
                  className="input"
                  value={form.collegeId}
                  onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
                  required
                >
                  <option value="">Select college…</option>
                  {colleges.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={creating} className="btn-primary text-sm">
              {creating ? 'Sending invite...' : 'Create & send invite'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input className="input pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>{r.replace(/-/g, ' ')}</option>
          ))}
        </select>
        {isSuperadmin && (
          <select className="input sm:w-56" value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)}>
            <option value="">All colleges</option>
            {colleges.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-xs text-subtle uppercase">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                {isSuperadmin && <th className="text-left px-4 py-3">College</th>}
                <th className="text-left px-4 py-3">XP</th>
                <th className="text-left px-4 py-3">Status</th>
                {canManage && <th className="text-right px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-border/50 hover:bg-surface-2/30">
                  <td className="px-4 py-3 text-sm text-content">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted">{u.role}{u.platformRole ? ` / ${u.platformRole}` : ''}</span>
                  </td>
                  {isSuperadmin && <td className="px-4 py-3 text-sm text-muted">{u.college?.name || '—'}</td>}
                  <td className="px-4 py-3 text-sm text-brand-600 dark:text-brand-400">{u.learningXP || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.status === 'active' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : u.status === 'invited' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                      {u.status}
                    </span>
                  </td>
                  {canManage && (
                  <td className="px-4 py-3 text-right">
                    {u._id !== currentUser?._id && (
                      <button onClick={() => toggleStatus(u)} className={`btn-ghost p-1.5 ${u.status === 'active' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {u.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                      </button>
                    )}
                  </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-subtle">Loading...</div>}
        {!loading && users.length === 0 && <div className="p-8 text-center text-subtle">No users found.</div>}
      </div>
    </div>
  );
}
