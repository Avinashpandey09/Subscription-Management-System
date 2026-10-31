import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const homeFor = (role) => (role === 'customer' ? '/portal' : role === 'admin' ? '/admin/staff' : '/staff/subscriptions');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
            try {
              const user = await login(email, password);
              navigate(homeFor(user.role));
            } catch (err) {
              setError(err.response?.data?.message || 'Login failed');
            }
          }}
        >
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          <div className="mt">
            <button type="submit">Log in</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
        <p className="hint">
          No account? <Link to="/signup">Sign up</Link> · <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <p className="hint">Seeded demo logins (password Demo@1234): admin@demo.local, staff@demo.local, customer@demo.local</p>
      </div>
    </div>
  );
}
