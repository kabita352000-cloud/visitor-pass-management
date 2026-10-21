import { useEffect, useState } from 'react';
import { CalendarDays, Plus, ScanLine, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import Notice from '../components/Notice.jsx';
import PageTitle from '../components/PageTitle.jsx';
import { getErrorMessage } from '../utils/errors.js';

const summaryCards = [
  ['Total visitors', 'visitors', 'Registered profiles', 'blue'],
  ['Appointments', 'appointments', 'All scheduled visits', 'purple'],
  ['Awaiting approval', 'pendingAppointments', 'Need your attention', 'orange'],
  ['Currently inside', 'checkedIn', 'Checked in now', 'green']
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/dashboard/stats', { signal: controller.signal })
      .then(response => setData(response.data))
      .catch(requestError => {
        if (requestError.name !== 'CanceledError') {
          setError(getErrorMessage(requestError, 'Could not load dashboard'));
        }
      });
    return () => controller.abort();
  }, []);

  const stats = data?.stats || {};

  return (
    <>
      <PageTitle
        eyebrow="OVERVIEW"
        title="Good day"
        subtitle="Here’s what’s happening at your front desk today."
        action={<Link className="primary link-button" to="/visitors"><Plus size={17} /> Register visitor</Link>}
      />
      <Notice>{error}</Notice>
      <div className="stats-grid">
        {summaryCards.map(([label, key, note, color]) => (
          <div className="stat-card" key={key}>
            <div className={`stat-icon ${color}`}><Users size={19} /></div>
            <div className="stat-label">{label}</div>
            <div className="stat-number">{stats[key] ?? '—'}</div>
            <div className="stat-note">{note}</div>
          </div>
        ))}
      </div>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent access activity</h2>
              <p>Latest check-in and check-out events</p>
            </div>
            <Link to="/logs" className="text-link">View all →</Link>
          </div>
          {!data && !error ? (
            <p className="muted">Loading recent activity…</p>
          ) : data?.recentLogs?.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Visitor</th><th>Activity</th><th>Time</th></tr></thead>
                <tbody>
                  {data.recentLogs.map(log => (
                    <tr key={log._id}>
                      <td><b>{log.visitor?.name || 'Visitor'}</b></td>
                      <td><span className={`pill ${log.action === 'check-in' ? 'success' : 'neutral'}`}>{log.action}</span></td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>{error ? 'Dashboard activity is not available right now.' : 'Check in a visitor to see recent activity here.'}</EmptyState>
          )}
        </section>
        <section className="panel quick-panel">
          <div className="panel-heading">
            <div><h2>Quick actions</h2><p>Common front desk tasks</p></div>
          </div>
          <Link to="/visitors" className="quick-action">
            <span className="quick-icon blue"><Users /></span>
            <span><b>Register a visitor</b><small>Add visitor details to the system</small></span>
            <span className="arrow">→</span>
          </Link>
          <Link to="/appointments" className="quick-action">
            <span className="quick-icon purple"><CalendarDays /></span>
            <span><b>Review appointments</b><small>Approve pending visit requests</small></span>
            <span className="arrow">→</span>
          </Link>
          <Link to="/scan" className="quick-action">
            <span className="quick-icon green"><ScanLine /></span>
            <span><b>Scan a pass</b><small>Record check-in or check-out</small></span>
            <span className="arrow">→</span>
          </Link>
        </section>
      </div>
    </>
  );
}
