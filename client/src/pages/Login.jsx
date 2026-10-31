import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getApiError } from '../api.js';

const homeFor = (role) => (role === 'customer' ? '/portal' : role === 'admin' ? '/admin/staff' : '/staff/subscriptions');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="auth-wrap">
      <div className="card">
        <h1>Log in</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setSubmitting(true);
            try {
              const user = await login(email, password);
              navigate(homeFor(user.role));
            } catch (err) {
              setError(getApiError(err, 'Login failed'));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required />
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
          <div className="mt">
            <button type="submit" disabled={submitting}>{submitting ? 'Logging in...' : 'Log in'}</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
        <p className="hint">
          No account? <Link to="/signup">Sign up</Link> · <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <div className="hint">
          <strong>Evaluator demo accounts</strong>
          <br />
          Admin: admin@demo.example.com / Demo@1234
          <br />
          Staff: staff@demo.example.com / Demo@1234
          <br />
          Customer: customer@demo.example.com / Demo@1234
        </div>
      </div>
    </div>
  );
}
