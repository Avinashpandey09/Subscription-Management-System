import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getApiError } from '../api.js';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="auth-wrap">
      <div className="card">
        <h1>Create customer account</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setSubmitting(true);
            try {
              await signup(name, email, password);
              navigate('/portal');
            } catch (err) {
              setError(getApiError(err, 'Signup failed'));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} minLength="2" maxLength="120" autoComplete="name" required />
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required />
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength="8"
            maxLength="128"
            autoComplete="new-password"
            required
          />
          <p className="hint">8-128 characters with uppercase, lowercase, number, and special character.</p>
          <div className="mt">
            <button type="submit" disabled={submitting}>{submitting ? 'Creating account...' : 'Sign up'}</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
        <p className="hint">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
