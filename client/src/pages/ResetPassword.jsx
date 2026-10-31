import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getApiError } from '../api.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="auth-wrap">
      <div className="card">
        <h1>Set a new password</h1>
        {done ? (
          <p>
            Password reset. <Link to="/login">Log in</Link>
          </p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              setSubmitting(true);
              try {
                await api.post('/auth/reset-password', { token: params.get('token') || '', password });
                setDone(true);
              } catch (err) {
                setError(getApiError(err, 'Reset failed'));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <label>New password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            <p className="hint">8-128 characters with uppercase, lowercase, number, and special character.</p>
            <div className="mt">
              <button type="submit" disabled={submitting}>{submitting ? 'Resetting...' : 'Reset password'}</button>
            </div>
            {error && <div className="error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
