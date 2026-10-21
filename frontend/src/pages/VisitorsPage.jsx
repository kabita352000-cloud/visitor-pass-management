import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import Notice from '../components/Notice.jsx';
import PageTitle from '../components/PageTitle.jsx';
import { getErrorMessage } from '../utils/errors.js';

const emptyVisitor = {
  name: '',
  email: '',
  phone: '',
  company: '',
  purpose: '',
  host: '',
  photoUrl: ''
};

const fields = [
  ['name', 'Full name', true, 'text'],
  ['email', 'Email address', true, 'email'],
  ['phone', 'Phone number', true, 'tel'],
  ['company', 'Company', false, 'text'],
  ['purpose', 'Visit purpose', true, 'text'],
  ['host', 'Employee / host', true, 'text'],
  ['photoUrl', 'Photo URL (optional)', false, 'url']
];

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [visitor, setVisitor] = useState(emptyVisitor);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/visitors', {
          params: { search, limit: 300 },
          signal: controller.signal
        });
        setVisitors(response.data.visitors);
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          setError(getErrorMessage(requestError, 'Could not load visitors'));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, reload]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.post('/visitors', visitor);
      setMessage('Visitor registered successfully.');
      setVisitor(emptyVisitor);
      setShowForm(false);
      setReload(value => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not register visitor'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="DIRECTORY"
        title="Visitors"
        subtitle="Manage visitor profiles and contact details."
        action={(
          <button className="primary" type="button" onClick={() => setShowForm(value => !value)}>
            <Plus size={17} /> {showForm ? 'Cancel' : 'Register visitor'}
          </button>
        )}
      />
      <Notice type="success" onDismiss={() => setMessage('')}>{message}</Notice>
      <Notice>{error}</Notice>
      {showForm && (
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h2>New visitor details</h2>
          <div className="form-grid">
            {fields.map(([name, label, required, type]) => (
              <label key={name}>
                {label}
                <input
                  type={type}
                  value={visitor[name]}
                  onChange={event => setVisitor(current => ({ ...current, [name]: event.target.value }))}
                  required={required}
                  placeholder={label}
                />
              </label>
            ))}
          </div>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save visitor'}
          </button>
        </form>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div><h2>Visitor directory</h2><p>{visitors.length} profiles shown</p></div>
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label="Search visitors"
              placeholder="Search name, company, host…"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </label>
        </div>
        {loading ? <p className="muted">Loading visitors…</p> : visitors.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Visitor</th><th>Company</th><th>Purpose</th><th>Host</th><th>Registered</th></tr></thead>
              <tbody>
                {visitors.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div className="visitor-cell">
                        {item.photoUrl
                          ? <img src={item.photoUrl} alt="" loading="lazy" />
                          : <span className="visitor-avatar">{item.name?.slice(0, 1)}</span>}
                        <span><b>{item.name}</b><small>{item.email || item.phone}</small></span>
                      </div>
                    </td>
                    <td>{item.company || '—'}</td>
                    <td>{item.purpose}</td>
                    <td>{item.host}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>{error ? 'Visitor records could not be loaded.' : 'Try another search or register your first visitor.'}</EmptyState>
        )}
      </section>
    </>
  );
}
