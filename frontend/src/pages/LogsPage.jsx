import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import Notice from '../components/Notice.jsx';
import PageTitle from '../components/PageTitle.jsx';
import '../styles/logs.css';
import { downloadFile } from '../utils/download.js';
import { getErrorMessage } from '../utils/errors.js';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: '', from: '', to: '' });
  const [draftFilters, setDraftFilters] = useState({ action: '', from: '', to: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function getQueryParams() {
    return {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.from ? { from: `${filters.from}T00:00:00` } : {}),
      ...(filters.to ? { to: `${filters.to}T23:59:59.999` } : {})
    };
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/checklogs', { params: getQueryParams(), signal: controller.signal })
      .then(response => setLogs(response.data.logs))
      .catch(requestError => {
        if (requestError.name !== 'CanceledError') {
          setError(getErrorMessage(requestError, 'Could not load logs'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  function updateFilter(event) {
    setDraftFilters(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setFilters(draftFilters);
  }

  function clearFilters() {
    const emptyFilters = { action: '', from: '', to: '' };
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
  }

  async function exportCsv() {
    setError('');
    try {
      const response = await api.get('/reports/export.csv', { params: getQueryParams(), responseType: 'blob' });
      downloadFile(response.data, 'visitor-check-logs.csv');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not export report'));
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="AUDIT TRAIL"
        title="Check logs"
        subtitle="A timestamped record of visitor access activity."
        action={<button className="secondary" type="button" onClick={exportCsv}><Download size={17} /> Export CSV</button>}
      />
      <Notice>{error}</Notice>
      <section className="panel">
        <form className="log-filters" onSubmit={applyFilters}>
          <label>
            Action
            <select name="action" value={draftFilters.action} onChange={updateFilter}>
              <option value="">All actions</option>
              <option value="check-in">Check in</option>
              <option value="check-out">Check out</option>
            </select>
          </label>
          <label>
            From
            <input name="from" type="date" value={draftFilters.from} onChange={updateFilter} />
          </label>
          <label>
            To
            <input name="to" type="date" min={draftFilters.from || undefined} value={draftFilters.to} onChange={updateFilter} />
          </label>
          <button className="primary" type="submit">Apply filters</button>
          <button className="secondary" type="button" onClick={clearFilters}>Clear</button>
        </form>
        <div className="panel-heading">
          <div><h2>Access history</h2><p>{logs.length} recent events</p></div>
        </div>
        {loading ? <p className="muted">Loading access history…</p> : logs.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date / time</th><th>Visitor</th><th>Action</th><th>Pass code</th><th>Handled by</th><th>Note</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><b>{log.visitor?.name || 'Visitor'}</b></td>
                    <td><span className={`pill ${log.action === 'check-in' ? 'success' : 'neutral'}`}>{log.action}</span></td>
                    <td>{log.pass?.code || '—'}</td>
                    <td>{log.performedBy?.name || '—'}</td>
                    <td>{log.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>{error ? 'Access records could not be loaded.' : 'Check-in and check-out events will appear here.'}</EmptyState>
        )}
      </section>
    </>
  );
}
