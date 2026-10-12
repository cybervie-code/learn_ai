import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { Award, Users, Trash2, Plus, Eye, Download, Search, CheckCircle, Clock } from 'lucide-react';

export default function Certificates() {
  const [activeTab, setActiveTab] = useState('issued');
  const [certificates, setCertificates] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (activeTab === 'issued') {
      fetchCertificates();
    } else {
      fetchEligibleStudents();
    }
  }, [activeTab]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.listAllCertificates();
      if (res.data?.success) {
        setCertificates(res.data.certificates || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async () => {
    try {
      setLoading(true);
      const res = await api.listEligibleStudents();
      if (res.data?.success) {
        setEligibleStudents(res.data.eligibleStudents || []);
      }
    } catch (error) {
      console.error('Error fetching eligible students:', error);
      toast.error('Failed to fetch eligible students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEligibleStudents = async () => {
    const emails = emailInput
      .split('\n')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error('Please enter at least one email');
      return;
    }

    setAdding(true);
    try {
      const res = await api.addEligibleStudents(emails);
      if (res.data?.success) {
        const dupMsg = res.data.duplicates?.length > 0 ? ` (${res.data.duplicates.length} duplicate(s) skipped)` : '';
        toast.success(`Added ${res.data.addedCount} eligible student(s)${dupMsg}`);
        setEmailInput('');
        fetchEligibleStudents();
      } else {
        toast.error(res.data?.message || 'Failed to add students');
      }
    } catch (error) {
      console.error('Error adding eligible students:', error);
      toast.error(error.response?.data?.message || 'Failed to add students');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveEligibleStudent = async (email) => {
    if (!window.confirm(`Remove ${email} from the eligible students list?`)) return;

    try {
      const res = await api.removeEligibleStudent(email);
      if (res.data?.success) {
        toast.success('Student removed from eligible list');
        fetchEligibleStudents();
      } else {
        toast.error(res.data?.message || 'Failed to remove student');
      }
    } catch (error) {
      console.error('Error removing eligible student:', error);
      toast.error(error.response?.data?.message || 'Failed to remove student');
    }
  };

  const handleToggleStatus = async (email, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active';
    try {
      const res = await api.updateEligibleStatus(email, newStatus);
      if (res.data?.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchEligibleStudents();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleActivateAll = async () => {
    const pendingCount = eligibleStudents.filter(e => e.status === 'pending').length;
    if (pendingCount === 0) { toast('No pending students to activate'); return; }
    if (!window.confirm(`Activate all ${pendingCount} pending students?`)) return;

    setActivating(true);
    try {
      const res = await api.activateAllEligible();
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchEligibleStudents();
      }
    } catch (error) {
      toast.error('Failed to activate all students');
    } finally {
      setActivating(false);
    }
  };

  const handleView = (serialNumber) => {
    const token = localStorage.getItem('cybervie_token');
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5055/api';
    window.open(`${apiBase}/certificates/view/${serialNumber}?token=${token}`, '_blank');
  };

  const handleDownload = (serialNumber) => {
    const token = localStorage.getItem('cybervie_token');
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5055/api';
    window.location.href = `${apiBase}/certificates/download/${serialNumber}?token=${token}`;
  };

  const filteredCertificates = certificates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.serialNumber?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) ||
      c.studentEmail?.toLowerCase().includes(q)
    );
  });

  const filteredEligible = eligibleStudents.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.email?.toLowerCase().includes(q) ||
      e.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content mb-2">Hackathon Certificates</h1>
        <p className="text-subtle">
          Manage eligibility lists and inspect all issued AI Engineering Hackathon certificates
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-border pb-3">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('issued');
              setSearch('');
            }}
            className={`pb-2 font-medium transition-colors flex items-center gap-2 border-b-2 -mb-[14px] ${
              activeTab === 'issued'
                ? 'text-brand-500 border-brand-500'
                : 'text-subtle hover:text-content border-transparent'
            }`}
          >
            <Award className="w-4 h-4" />
            Issued Certificates ({certificates.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('eligible');
              setSearch('');
            }}
            className={`pb-2 font-medium transition-colors flex items-center gap-2 border-b-2 -mb-[14px] ${
              activeTab === 'eligible'
                ? 'text-brand-500 border-brand-500'
                : 'text-subtle hover:text-content border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            Eligible Students ({eligibleStudents.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface border border-border rounded-lg text-content focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-subtle">Loading data...</div>
        </div>
      ) : activeTab === 'issued' ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-alt/70 text-subtle text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">Serial Number</th>
                  <th className="px-5 py-3 font-semibold">Student Name</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Issue Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-subtle">
                      No certificates issued yet.
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-surface-alt/40 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-brand-600 dark:text-brand-400">
                        {cert.serialNumber}
                      </td>
                      <td className="px-5 py-3 font-medium text-content">{cert.studentName}</td>
                      <td className="px-5 py-3 text-subtle">{cert.studentEmail}</td>
                      <td className="px-5 py-3 text-subtle">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            cert.status === 'downloaded'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : cert.status === 'generated'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleView(cert.serialNumber)}
                            title="View PDF"
                            className="p-1.5 rounded hover:bg-surface text-subtle hover:text-content transition-colors"
                          >
                            <Eye className="w-4 h-4 text-brand-500" />
                          </button>
                          <button
                            onClick={() => handleDownload(cert.serialNumber)}
                            title="Download PDF"
                            className="p-1.5 rounded hover:bg-surface text-subtle hover:text-content transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-content mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-500" />
              Add Eligible Emails
            </h3>
            <p className="text-xs text-subtle mb-4">
              Paste email addresses below (one email per line). New emails are added as <strong>pending</strong>.
            </p>
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="student1@vnrvjiet.in&#10;student2@gmail.com"
              rows={8}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-content placeholder-subtle text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none font-mono"
            />
            <button
              onClick={handleAddEligibleStudents}
              disabled={adding || !emailInput.trim()}
              className="mt-3 w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Adding...' : 'Add to Eligible List'}
            </button>

            <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mb-2">
                Hackathon Completion Action
              </p>
              <p className="text-xs text-subtle mb-3">
                After the hackathon is over, activate all pending students at once so they can claim their certificates.
              </p>
              <button
                onClick={handleActivateAll}
                disabled={activating}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {activating ? 'Activating...' : 'Activate All Pending'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border bg-surface-alt/40 flex items-center justify-between">
              <h3 className="font-semibold text-content">
                Eligible Students ({filteredEligible.length})
              </h3>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Active: {eligibleStudents.filter(e => e.status === 'active').length}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  Pending: {eligibleStudents.filter(e => e.status === 'pending').length}
                </span>
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-alt/70 text-subtle text-xs uppercase tracking-wider sticky top-0 border-b border-border">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Name</th>
                    <th className="px-5 py-2.5 font-semibold">Email</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredEligible.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-subtle">
                        No eligible students found.
                      </td>
                    </tr>
                  ) : (
                    filteredEligible.map((student) => (
                      <tr key={student.id} className="hover:bg-surface-alt/30 transition-colors">
                        <td className="px-5 py-3 text-content font-medium">{student.name || '—'}</td>
                        <td className="px-5 py-3 font-mono text-sm text-content">{student.email}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                              student.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                            onClick={() => handleToggleStatus(student.email, student.status)}
                            title={`Click to toggle to ${student.status === 'active' ? 'pending' : 'active'}`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleRemoveEligibleStudent(student.email)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
