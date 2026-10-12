import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import { Award, Download, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function Certificate() {
  const { user } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityStatus, setEligibilityStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchCertificateStatus();
  }, []);

  const fetchCertificateStatus = async () => {
    try {
      const res = await api.getCertificateStatus();
      if (res.data?.success) {
        setHasCertificate(res.data.hasCertificate);
        setIsEligible(!!res.data.isEligible);
        setEligibilityStatus(res.data.eligibilityStatus || 'none');
        if (res.data.hasCertificate) {
          setCertificate(res.data.certificate);
        }
      }
    } catch (error) {
      console.error('Error fetching certificate status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCertificate = async () => {
    setRequesting(true);
    try {
      const res = await api.requestCertificate();
      if (res.data?.success) {
        toast.success(res.data.message || 'Certificate ready!');
        setHasCertificate(true);
        setCertificate(res.data.certificate);
      } else {
        toast.error(res.data?.message || 'Failed to request certificate');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to request certificate';
      toast.error(msg);
    } finally {
      setRequesting(false);
    }
  };

  const handleViewCertificate = () => {
    if (certificate?.serialNumber) {
      const token = localStorage.getItem('cybervie_token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5055/api';
      window.open(`${apiBase}/certificates/view/${certificate.serialNumber}?token=${token}`, '_blank');
    }
  };

  const handleDownloadCertificate = () => {
    if (certificate?.serialNumber) {
      const token = localStorage.getItem('cybervie_token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5055/api';
      window.location.href = `${apiBase}/certificates/download/${certificate.serialNumber}?token=${token}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-subtle">Loading certificate status...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content mb-2">Hackathon Certificate</h1>
        <p className="text-subtle">
          Request and download your AI Engineering Hackathon participation certificate
        </p>
      </div>

      {!hasCertificate ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-content mb-2">
            AI Engineering Hackathon Certificate
          </h2>
          <p className="text-subtle max-w-md mx-auto mb-6">
            Organized by <strong>VNRVJIET</strong> in association with <strong>Cybervie</strong>.
            Certificates are issued to verified hackathon participants.
          </p>

          {isEligible ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Your email ({user?.email}) is eligible
              </div>
              <div>
                <button
                  onClick={handleRequestCertificate}
                  disabled={requesting}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg shadow disabled:opacity-50 transition-colors"
                >
                  {requesting ? 'Generating Certificate...' : 'Request Hackathon Certificate'}
                </button>
              </div>
            </div>
          ) : eligibilityStatus === 'pending' ? (
            <div className="max-w-md mx-auto p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm flex items-start gap-3 text-left">
              <Clock className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Pending Activation</p>
                <p>
                  Your registration for the AI Engineering Hackathon has been confirmed!
                  Your certificate will become available once the hackathon is completed.
                  Please check back after the event.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Not in Eligible List</p>
                <p>
                  Your account email <strong>{user?.email}</strong> is not listed as eligible for this hackathon certificate.
                  If you attended the event, please contact the hackathon administrator.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-content">
                  Certificate of Participation
                </h2>
                <p className="text-subtle text-sm">AI Engineering Hackathon • VNRVJIET & Cybervie</p>
              </div>
            </div>
            <div>
              {certificate.status === 'requested' ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium">
                  <Clock className="w-4 h-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Verified & Ready
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-surface-alt/40 p-4 rounded-lg border border-border">
            <div>
              <p className="text-xs uppercase tracking-wider text-subtle font-semibold mb-1">Certificate ID</p>
              <p className="font-mono text-base font-semibold text-content">{certificate.serialNumber}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-subtle font-semibold mb-1">Issue Date</p>
              <p className="text-base text-content font-medium">
                {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleViewCertificate}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-surface border border-border rounded-lg hover:bg-surface-alt font-medium text-content transition-colors"
            >
              <Eye className="w-5 h-5 text-brand-500" />
              View Certificate
            </button>
            <button
              onClick={handleDownloadCertificate}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
