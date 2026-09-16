import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Building2, Plus, Search, Globe, CheckCircle2, XCircle, Users, Edit3, X,
} from 'lucide-react';

export default function Colleges() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = () => {
    api.listColleges({ search, limit: 50 }).then((res) => {
      setColleges(res.data.data.colleges);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [search]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-content flex items-center gap-2">
            <Building2 size={24} className="text-brand-600 dark:text-brand-400" /> Colleges
          </h1>
          <p className="text-muted mt-1">Manage registered colleges and their domains</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary shrink-0">
          <Plus size={16} /> Add College
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          className="input pl-10"
          placeholder="Search colleges by name, code, or domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {colleges.map((c) => (
          <div key={c._id} className="card p-5 hover:border-brand-600/50 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-content">{c.name}</h3>
                <p className="text-xs text-subtle mt-0.5">{c.city}, {c.state}</p>
              </div>
              <span className={`badge ${c.status === 'active' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                {c.status}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs text-subtle">
              <span>Code: {c.shortCode || '—'}</span>
              <span>Plan: {c.subscription?.plan}</span>
              <span>Seats: {c.subscription?.seatsUsed || 0}/{c.subscription?.seatLimit || 0}</span>
            </div>

            <div className="mt-3 space-y-1">
              {c.domains?.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {d.verified
                    ? <CheckCircle2 size={12} className="text-green-600 dark:text-green-400" />
                    : <XCircle size={12} className="text-yellow-600 dark:text-yellow-400" />}
                  <span className={d.verified ? 'text-muted' : 'text-subtle'}>{d.domain}</span>
                </div>
              ))}
              {(!c.domains || c.domains.length === 0) && (
                <p className="text-xs text-subtle">No domains added</p>
              )}
            </div>

            <button onClick={() => setSelected(c)} className="btn-secondary w-full mt-4 text-sm">
              <Edit3 size={14} /> Manage
            </button>
          </div>
        ))}
      </div>

      {loading && <div className="text-subtle p-8 text-center">Loading...</div>}
      {!loading && colleges.length === 0 && <div className="card p-12 text-center text-subtle">No colleges found.</div>}

      {showCreate && <CreateCollegeForm onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {selected && <CollegeDetailModal college={selected} onClose={() => setSelected(null)} onUpdated={() => { setSelected(null); load(); }} />}
    </div>
  );
}

function CreateCollegeForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', shortCode: '', website: '', city: '', state: '', plan: 'trial', seatLimit: 100 });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createCollege(form);
      toast.success('College created');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create college');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form className="card p-6 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content">Add New College</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-subtle" /></button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Short Code</label><input className="input" value={form.shortCode} onChange={(e) => setForm({ ...form, shortCode: e.target.value })} placeholder="IITD" /></div>
          <div><label className="label">Website</label><input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div><label className="label">City</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">State</label><input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><label className="label">Plan</label>
            <select className="input" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="trial">Trial</option>
              <option value="essential">Essential</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div><label className="label">Seat Limit</label><input type="number" className="input" value={form.seatLimit} onChange={(e) => setForm({ ...form, seatLimit: e.target.value })} /></div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Creating...' : 'Create College'}</button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function CollegeDetailModal({ college, onClose, onUpdated }) {
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const addDomain = async () => {
    if (!newDomain) return;
    setLoading(true);
    try {
      await api.addDomain(college._id, newDomain);
      toast.success('Domain added');
      setNewDomain('');
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add domain');
    } finally { setLoading(false); }
  };

  const verifyDomain = async (domain) => {
    try {
      await api.verifyDomain(college._id, { domain, method: 'manual' });
      toast.success('Domain verified');
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify domain');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card p-6 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content">{college.name}</h2>
          <button onClick={onClose}><X size={18} className="text-subtle" /></button>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Verified Domains</h3>
          <div className="space-y-2">
            {college.domains?.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-2/50">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-subtle" />
                  <span className="text-sm text-content">{d.domain}</span>
                </div>
                {d.verified ? (
                  <span className="badge bg-green-500/15 text-green-600 dark:text-green-400 text-xs"><CheckCircle2 size={10} /> Verified</span>
                ) : (
                  <button onClick={() => verifyDomain(d.domain)} className="btn-ghost text-xs text-brand-600 dark:text-brand-400">Verify</button>
                )}
              </div>
            ))}
            {(!college.domains || college.domains.length === 0) && <p className="text-xs text-subtle">No domains added yet.</p>}
          </div>

          <div className="flex gap-2 mt-3">
            <input className="input flex-1" placeholder="college.ac.in" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
            <button onClick={addDomain} disabled={loading} className="btn-primary"><Plus size={14} /> Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
