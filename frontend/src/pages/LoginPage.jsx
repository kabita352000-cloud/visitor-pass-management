import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api.js';
import Notice from '../components/Notice.jsx';
import { getErrorMessage } from '../utils/errors.js';

function getHomePath(role) {
  if (role === 'visitor') return '/my-visit';
  if (role === 'employee') return '/visitors';
  return '/';
}

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && localStorage.getItem('vp_token')) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      signIn(data);
      navigate(getHomePath(data.user.role), { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not sign in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-mark"><ShieldCheck size={28} /></div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to Visitor Pass Management</p>
        <Notice>{error}</Notice>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />
        </label>
        <button className="primary full" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="hint">Demo accounts use password: <b>Pass1234!</b></div>
        <div className="hint">Visiting us? <Link className="text-link" to="/register">Create a visitor account</Link></div>
      </form>
    </div>
  );
}
