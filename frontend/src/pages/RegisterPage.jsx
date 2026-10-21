import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import Notice from '../components/Notice.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../utils/errors.js';

export default function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    let accountCreated = false;
    try {
      await api.post('/auth/register', form);
      accountCreated = true;
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password
      });
      signIn(data);
      navigate('/my-visit', { replace: true });
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Could not create your account');
      setError(accountCreated
        ? `Your account was created, but sign-in failed: ${message}. Please sign in.`
        : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-mark"><ShieldCheck size={28} /></div>
        <h1>Create visitor account</h1>
        <p className="muted">Register to request a visit with your host.</p>
        <Notice>{error}</Notice>
        <label>
          Full name
          <input name="name" autoComplete="name" value={form.name} onChange={updateField} required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Phone number
          <input name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField} required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={updateField} required />
        </label>
        <button className="primary full" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <div className="hint">Already registered? <Link className="text-link" to="/login">Sign in</Link></div>
      </form>
    </div>
  );
}
