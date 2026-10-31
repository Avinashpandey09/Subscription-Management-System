import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

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
              try {
                await api.post('/auth/reset-password', { token: params.get('token') || '', password });
                setDone(true);
              } catch (err) {
                const issues = err.response?.data?.issues?.map((i) => i.message).join('. ');
                setError(issues || err.response?.data?.message || 'Reset failed');
              }
            }}
          >
            <label>New password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            <div className="mt">
              <button type="submit">Reset password</button>
            </div>
            {error && <div className="error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
