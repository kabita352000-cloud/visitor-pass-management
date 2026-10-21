import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import Notice from '../components/Notice.jsx';
import PageTitle from '../components/PageTitle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getLocalDateTime } from '../utils/dateTime.js';
import { getErrorMessage } from '../utils/errors.js';

const emptyAppointment = {
  visitorName: '',
  visitorEmail: '',
  visitorPhone: '',
  company: '',
  purpose: '',
  host: '',
  scheduledAt: ''
};

const fields = [
  ['visitorName', 'Visitor name', true, 'text'],
  ['visitorEmail', 'Visitor email', true, 'email'],
  ['visitorPhone', 'Phone', true, 'tel'],
  ['company', 'Company', false, 'text'],
  ['purpose', 'Purpose', true, 'text'],
  ['host', 'Host / employee', true, 'text']
];

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [appointment, setAppointment] = useState(emptyAppointment);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const canReview = ['admin', 'employee'].includes(user?.role);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/appointments', { signal: controller.signal })
      .then(response => setAppointments(response.data.appointments))
      .catch(requestError => {
        if (requestError.name !== 'CanceledError') {
          setError(getErrorMessage(requestError, 'Could not load appointments'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.post('/appointments', appointment);
      setMessage('Appointment request submitted.');
      setAppointment(emptyAppointment);
      setShowForm(false);
      setReload(value => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not submit appointment'));
    } finally {
      setSaving(false);
    }
  }

  async function reviewAppointment(id, status) {
    setError('');
    setMessage('');
    try {
      await api.patch(`/appointments/${id}/approve`, { status });
      setMessage(`Appointment ${status}.`);
      setReload(value => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not update appointment'));
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="SCHEDULING"
        title="Appointments"
        subtitle="Review upcoming visits and manage approval requests."
        action={(
          <button className="primary" type="button" onClick={() => setShowForm(value => !value)}>
            <Plus size={17} /> {showForm ? 'Cancel' : 'New appointment'}
          </button>
        )}
      />
      <Notice type="success" onDismiss={() => setMessage('')}>{message}</Notice>
      <Notice>{error}</Notice>
      {showForm && (
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h2>Schedule a visit</h2>
          <div className="form-grid">
            {fields.map(([name, label, required, type]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  type={type}
                  value={appointment[name]}
                  onChange={event => setAppointment(current => ({ ...current, [name]: event.target.value }))}
                  required={required}
                />
              </label>
            ))}
            <label>
              Scheduled at
              <input
                type="datetime-local"
                min={getLocalDateTime()}
                value={appointment.scheduledAt}
                onChange={event => setAppointment(current => ({ ...current, scheduledAt: event.target.value }))}
                required
              />
            </label>
          </div>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? 'Submitting…' : 'Submit appointment'}
          </button>
        </form>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div><h2>Appointment requests</h2><p>Requests and scheduled visits</p></div>
        </div>
        {loading ? <p className="muted">Loading appointments…</p> : appointments.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Visitor</th><th>Purpose / host</th><th>Scheduled</th><th>Status</th>{canReview && <th>Action</th>}</tr></thead>
              <tbody>
                {appointments.map(item => (
                  <tr key={item._id}>
                    <td><b>{item.visitorName}</b><small>{item.visitorPhone}</small></td>
                    <td>{item.purpose}<small>Host: {item.host}</small></td>
                    <td>{new Date(item.scheduledAt).toLocaleString()}</td>
                    <td>
                      <span className={`pill ${item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}`}>
                        {item.status}
                      </span>
                    </td>
                    {canReview && (
                      <td>
                        {item.status === 'pending' && (
                          <div className="action-row">
                            <button className="small-btn approve" type="button" onClick={() => reviewAppointment(item._id, 'approved')}>Approve</button>
                            <button className="small-btn reject" type="button" onClick={() => reviewAppointment(item._id, 'rejected')}>Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>{error ? 'Appointment records could not be loaded.' : 'No appointments have been created yet.'}</EmptyState>
        )}
      </section>
    </>
  );
}
