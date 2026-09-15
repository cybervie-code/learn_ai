import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users as UsersIcon, Search, Ban, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isSuperadmin = currentUser?.platformRole === 'superadmin';

  const load = () => {
    const fn = isSuperadmin ? api.listAllUsers : api.listCollegeUsers;
    fn({ search, limit: 50 }).then((res) => {
      setUsers(res.data.data.users);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [search]);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content flex items-center gap-2">
          <UsersIcon size={24} className="text-brand-600 dark:text-brand-400" /> {isSuperadmin ? 'All Users' : 'College Users'}
        </h1>
        <p className="text-muted mt-1">Manage user accounts and roles</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input className="input pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <th className="text-right px-4 py-3">Actions</th>
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
                    <span className={`badge ${u.status === 'active' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleStatus(u)} className={`btn-ghost p-1.5 ${u.status === 'active' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {u.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                  </td>
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
