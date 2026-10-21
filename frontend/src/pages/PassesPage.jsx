import { useEffect, useState } from 'react';
import { Download, QrCode } from 'lucide-react';
import api from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import Notice from '../components/Notice.jsx';
import PageTitle from '../components/PageTitle.jsx';
import { getLocalDateTime } from '../utils/dateTime.js';
import { downloadFile } from '../utils/download.js';
import { getErrorMessage } from '../utils/errors.js';

export default function PassesPage() {
  const [visitors, setVisitors] = useState([]);
  const [passes, setPasses] = useState([]);
  const [visitorId, setVisitorId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [issued, setIssued] = useState(null);
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
      api.get('/visitors', { params: { limit: 300 }, signal: controller.signal }),
      api.get('/passes', { params: { limit: 300 }, signal: controller.signal })
    ])
      .then(([visitorResponse, passResponse]) => {
        setVisitors(visitorResponse.data.visitors);
        setPasses(passResponse.data.passes);
      })
      .catch(requestError => {
        if (requestError.name !== 'CanceledError') {
          setError(getErrorMessage(requestError, 'Could not load passes'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  async function issuePass(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await api.post('/passes/issue', {
        visitorId,
        ...(validUntil ? { validUntil } : {})
      });
      setIssued(response.data);
      setMessage('Visitor pass issued.');
      setValidUntil('');
      setReload(value => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not issue pass'));
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
      setError(getErrorMessage(requestError, 'Could not download PDF badge'));
    }
  }

  async function revokePass(id) {
    setError('');
    try {
      await api.patch(`/passes/${id}/revoke`);
      setMessage('Visitor pass revoked.');
      setReload(value => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not revoke pass'));
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="ACCESS CREDENTIALS"
        title="Visitor passes"
        subtitle="Issue a QR-based pass and download a printable badge."
      />
      <Notice type="success" onDismiss={() => setMessage('')}>{message}</Notice>
      <Notice>{error}</Notice>
      <div className="content-grid pass-grid">
        <form className="panel form-panel" onSubmit={issuePass}>
          <h2><QrCode size={20} /> Issue a new pass</h2>
          <p className="muted">Select a registered visitor to create a unique pass.</p>
          <label>
            Visitor
            <select value={visitorId} onChange={event => setVisitorId(event.target.value)} required>
              <option value="">Select visitor</option>
              {visitors.map(visitor => (
                <option key={visitor._id} value={visitor._id}>{visitor.name} · {visitor.phone}</option>
              ))}
            </select>
          </label>
          <label>
            Valid until (optional)
            <input
              type="datetime-local"
              min={getLocalDateTime()}
              value={validUntil}
              onChange={event => setValidUntil(event.target.value)}
            />
          </label>
          <button className="primary full" type="submit" disabled={saving}>
            <QrCode size={17} /> {saving ? 'Creating pass…' : 'Generate visitor pass'}
          </button>
          {issued && (
            <div className="issued-card">
              <h3>Pass created successfully</h3>
              <img src={issued.qrDataUrl} alt={`QR code for pass ${issued.pass.code}`} />
              <b>{issued.pass.code}</b>
              <p>{issued.visitor.name}</p>
              <button className="secondary full" type="button" onClick={() => downloadBadge(issued.pass.code)}>
                <Download size={16} /> Download PDF badge
              </button>
            </div>
          )}
        </form>
        <section className="panel">
          <div className="panel-heading">
            <div><h2>Issued passes</h2><p>Recent passes and current status</p></div>
          </div>
          {loading ? <p className="muted">Loading passes…</p> : passes.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Visitor / code</th><th>Valid until</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {passes.map(pass => (
                    <tr key={pass._id}>
                      <td><b>{pass.visitor?.name || 'Visitor'}</b><small>{pass.code}</small></td>
                      <td>{new Date(pass.validUntil).toLocaleString()}</td>
                      <td>
                        <span className={`pill ${pass.status === 'checked-in' ? 'success' : pass.status === 'revoked' ? 'danger' : 'neutral'}`}>
                          {pass.status === 'active' && new Date(pass.validUntil) < new Date() ? 'expired' : pass.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-row">
                          <button className="small-btn" type="button" onClick={() => downloadBadge(pass.code)}>
                            <Download size={14} /> PDF
                          </button>
                          {['active', 'checked-out'].includes(pass.status) && (
                            <button className="small-btn reject" type="button" onClick={() => revokePass(pass._id)}>
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>{error ? 'Pass records could not be loaded.' : 'No passes issued yet.'}</EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
