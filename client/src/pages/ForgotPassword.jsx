import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

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
              await api.post('/auth/forgot-password', { email });
              setDone(true);
            }}
          >
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            <div className="mt">
              <button type="submit">Send reset link</button>
            </div>
          </form>
        )}
        <p className="hint">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
