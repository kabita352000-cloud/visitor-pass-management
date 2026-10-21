import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import Notice from '../components/Notice.jsx';
import PageTitle from '../components/PageTitle.jsx';
import { getErrorMessage } from '../utils/errors.js';

const emptyUser = { name: '', email: '', password: '', phone: '', role: 'employee' };

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(emptyUser);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/users', { signal: controller.signal })
      .then(response => setUsers(response.data.users))
      .catch(requestError => {
        if (requestError.name !== 'CanceledError') {
          setError(getErrorMessage(requestError, 'Could not load users'));
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
      await api.post('/users', user);
      setMessage('User account created.');
      setUser(emptyUser);
      setShowForm(false);
      setReload(value => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not create user account'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="ADMINISTRATION"
        title="Manage users"
        subtitle="Create staff and visitor accounts and review existing users."
        action={(
          <button className="primary" type="button" onClick={() => setShowForm(value => !value)}>
            <Plus size={17} /> {showForm ? 'Cancel' : 'Add user'}
          </button>
        )}
      />
      <Notice type="success" onDismiss={() => setMessage('')}>{message}</Notice>
      <Notice>{error}</Notice>
      {showForm && (
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h2>Create account</h2>
          <div className="form-grid">
            <label>
              Full name
              <input value={user.name} onChange={event => setUser(current => ({ ...current, name: event.target.value }))} required />
            </label>
            <label>
              Email
              <input type="email" value={user.email} onChange={event => setUser(current => ({ ...current, email: event.target.value }))} required />
            </label>
            <label>
              Temporary password
              <input type="password" minLength={8} autoComplete="new-password" value={user.password} onChange={event => setUser(current => ({ ...current, password: event.target.value }))} required />
            </label>
            <label>
              Phone (optional)
              <input type="tel" value={user.phone} onChange={event => setUser(current => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              Role
              <select value={user.role} onChange={event => setUser(current => ({ ...current, role: event.target.value }))}>
                <option value="employee">Employee / Host</option>
                <option value="security">Security / Frontdesk</option>
                <option value="visitor">Visitor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <button className="primary" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button>
        </form>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div><h2>Accounts</h2><p>{users.length} registered users</p></div>
        </div>
        {loading ? <p className="muted">Loading users…</p> : users.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th></tr></thead>
              <tbody>
                {users.map(item => (
                  <tr key={item.id}>
                    <td><b>{item.name}</b></td>
                    <td>{item.email}</td>
                    <td>{item.phone || '—'}</td>
                    <td><span className="pill neutral">{item.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>{error ? 'User accounts could not be loaded.' : 'No user accounts were found.'}</EmptyState>
        )}
      </section>
    </>
  );
}
