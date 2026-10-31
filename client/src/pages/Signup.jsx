import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
            try {
              await signup(name, email, password);
              navigate('/portal');
            } catch (err) {
              const issues = err.response?.data?.issues?.map((i) => i.message).join('. ');
              setError(issues || err.response?.data?.message || 'Signup failed');
            }
          }}
        >
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          <p className="hint">Longer than 8 characters, with an uppercase, a lowercase and a special character.</p>
          <div className="mt">
            <button type="submit">Sign up</button>
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
