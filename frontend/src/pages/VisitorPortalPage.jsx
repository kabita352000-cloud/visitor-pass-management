import { useEffect, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import '../styles/visitor.css';
import EmptyState from '../components/EmptyState.jsx';
import Notice from '../components/Notice.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getLocalDateTime } from '../utils/dateTime.js';
import { downloadFile } from '../utils/download.js';
import { getErrorMessage } from '../utils/errors.js';

const fields = [
  ['visitorName', 'Full name', 'text', true],
  ['visitorEmail', 'Email address', 'email', true],
  ['visitorPhone', 'Phone number', 'tel', true],
  ['company', 'Company', 'text', false],
  ['purpose', 'Purpose of visit', 'text', true],
  ['host', 'Employee / host', 'text', true]
];

export default function VisitorPortalPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    visitorName: user?.name || '',
    visitorEmail: user?.email || '',
    visitorPhone: user?.phone || '',
    company: '',
    purpose: '',
    host: '',
    scheduledAt: ''
  });
  const [appointments, setAppointments] = useState([]);
  const [passes, setPasses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/appointments/mine', { signal: controller.signal }),
      api.get('/passes/mine', { signal: controller.signal })
    ])
      .then(([appointmentResponse, passResponse]) => {
        setAppointments(appointmentResponse.data.appointments);
        setPasses(passResponse.data.passes);
      })
      .catch(requestError => {
        if (requestError.name !== 'CanceledError') {
          setError(getErrorMessage(requestError, 'Could not load your visit information'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.post('/appointments', form);
      setMessage('Your appointment request was submitted. The host will review it.');
      setForm(current => ({
        ...current,
        visitorPhone: user?.phone || '',
        company: '',
        purpose: '',
        host: '',
        scheduledAt: ''
      }));
      setReload(value => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not submit your request'));
    } finally {
      setSaving(false);
    }
  }

  async function downloadBadge(code) {
    setError('');
    try {
      const response = await api.get(`/passes/${encodeURIComponent(code)}/pdf`, { responseType: 'blob' });
      downloadFile(response.data, `${code}.pdf`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not download your pass'));
    }
  }

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="visitor-portal-page">
      <header className="visitor-portal-header">
        <div className="visitor-portal-brand"><ShieldCheck size={22} /> GatePass</div>
        <div>
          <span>{user?.name}</span>
          <button className="secondary" type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>
      <main className="visitor-portal-main">
        <div className="page-title">
          <div>
            <div className="eyebrow">VISITOR PORTAL</div>
            <h1>Your visits</h1>
            <p>Request an appointment and view approvals and digital passes.</p>
          </div>
        </div>
        <Notice type="success" onDismiss={() => setMessage('')}>{message}</Notice>
        <Notice>{error}</Notice>
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h2>Request a visit</h2>
          <div className="form-grid">
            {fields.map(([name, label, type, required]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={updateField}
                  required={required}
                />
              </label>
            ))}
            <label>
              Preferred date and time
              <input
                name="scheduledAt"
                type="datetime-local"
                min={getLocalDateTime()}
                value={form.scheduledAt}
                onChange={updateField}
                required
              />
            </label>
          </div>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? 'Sending request…' : 'Submit appointment request'}
          </button>
        </form>

        <section className="panel visitor-record-panel">
          <div className="panel-heading">
            <div><h2>Your appointments</h2><p>Approval status and visit schedule</p></div>
          </div>
          {loading ? <p className="muted">Loading appointments…</p> : appointments.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Scheduled</th><th>Purpose / host</th><th>Status</th></tr></thead>
                <tbody>
                  {appointments.map(appointment => (
                    <tr key={appointment._id}>
                      <td>{new Date(appointment.scheduledAt).toLocaleString()}</td>
                      <td>{appointment.purpose}<small>Host: {appointment.host}</small></td>
                      <td><span className={`pill ${appointment.status === 'approved' ? 'success' : appointment.status === 'rejected' ? 'danger' : 'warning'}`}>{appointment.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState>{error ? 'Appointment records could not be loaded.' : 'You have not requested a visit yet.'}</EmptyState>}
        </section>

        <section className="panel visitor-record-panel">
          <div className="panel-heading">
            <div><h2>Your digital passes</h2><p>Show the QR code or download a printable badge</p></div>
          </div>
          {loading ? <p className="muted">Loading passes…</p> : passes.length ? (
            <div className="visitor-pass-list">
              {passes.map(pass => (
                <article className="visitor-pass-card" key={pass._id}>
                  <img src={pass.qrDataUrl} alt={`QR code for ${pass.code}`} />
                  <div>
                    <b>{pass.code}</b>
                    <p>Valid until {new Date(pass.validUntil).toLocaleString()}</p>
                    <span className={`pill ${pass.status === 'revoked' ? 'danger' : pass.status === 'checked-in' ? 'success' : 'neutral'}`}>
                      {pass.status === 'active' && new Date(pass.validUntil) < new Date() ? 'expired' : pass.status}
                    </span>
                  </div>
                  <button className="secondary" type="button" onClick={() => downloadBadge(pass.code)}>
                    <Download size={16} /> PDF badge
                  </button>
                </article>
              ))}
            </div>
          ) : <EmptyState>{error ? 'Pass records could not be loaded.' : 'A pass will appear here after your visit is approved and reception issues it.'}</EmptyState>}
        </section>
      </main>
    </div>
  );
}
