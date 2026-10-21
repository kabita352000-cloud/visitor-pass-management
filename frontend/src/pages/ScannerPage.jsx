import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { LogIn, LogOut, ScanLine } from 'lucide-react';
import api from '../api.js';
import Notice from '../components/Notice.jsx';
import { getErrorMessage } from '../utils/errors.js';

export default function ScannerPage() {
  const [code, setCode] = useState('');
  const [action, setAction] = useState('check-in');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 220, height: 220 }, rememberLastUsedCamera: true },
      false
    );
    let clearRequested = false;
    const clearScanner = () => {
      if (clearRequested) return Promise.resolve();
      clearRequested = true;
      return scanner.clear();
    };

    try {
      scanner.render(decodedText => {
        setCode(decodedText.trim());
        setMessage('QR code detected. Confirm check-in or check-out to continue.');
        clearScanner().catch(scannerError => {
          console.error('Could not stop QR scanner:', scannerError);
        });
      }, () => {});
    } catch (scannerError) {
      setError(getErrorMessage(scannerError, 'Could not start the QR scanner'));
    }

    return () => {
      clearScanner().catch(scannerError => {
        console.error('Could not stop QR scanner:', scannerError);
      });
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await api.post(`/checklogs/${action}`, { code: code.trim() });
      setMessage(`${response.data.message}: ${response.data.visitor.name}`);
      setCode('');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not verify pass'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow">FRONT DESK</div>
          <h1>Scan &amp; verify</h1>
          <p>Scan a visitor’s QR code or enter the pass code manually.</p>
        </div>
      </div>
      <Notice type="success" onDismiss={() => setMessage('')}>{message}</Notice>
      <Notice>{error}</Notice>
      <div className="content-grid scan-grid">
        <section className="panel scanner-panel">
          <div className="panel-heading">
            <div><h2><ScanLine size={20} /> QR scanner</h2><p>Allow camera access to scan a pass</p></div>
          </div>
          <div id="qr-reader" />
          <p className="hint">Camera access requires permission and typically localhost or HTTPS.</p>
        </section>
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h2>Verify visitor pass</h2>
          <p className="muted">Choose an action and submit the pass code.</p>
          <div className="action-toggle">
            <button type="button" className={action === 'check-in' ? 'selected' : ''} onClick={() => setAction('check-in')}>
              <LogIn size={17} /> Check in
            </button>
            <button type="button" className={action === 'check-out' ? 'selected' : ''} onClick={() => setAction('check-out')}>
              <LogOut size={17} /> Check out
            </button>
          </div>
          <label>
            Pass code
            <input value={code} onChange={event => setCode(event.target.value)} placeholder="e.g. VP-DEMO12345" required />
          </label>
          <button className="primary full" type="submit" disabled={loading}>
            {loading ? 'Verifying…' : action === 'check-in' ? 'Confirm check-in' : 'Confirm check-out'}
          </button>
        </form>
      </div>
    </>
  );
}
