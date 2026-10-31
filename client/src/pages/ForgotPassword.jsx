import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiError } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="auth-wrap">
      <div className="card">
        <h1>Forgot password</h1>
        {done ? (
          <p>If that email exists, a reset link was sent. Check the server console in dev mode.</p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              setSubmitting(true);
              try {
                await api.post('/auth/forgot-password', { email });
                setDone(true);
              } catch (err) {
                setError(getApiError(err, 'Unable to send reset link'));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            <div className="mt">
              <button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send reset link'}</button>
            </div>
            {error && <div className="error">{error}</div>}
          </form>
        )}
        <p className="hint">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
