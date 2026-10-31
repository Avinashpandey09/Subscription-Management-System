import { useEffect, useState } from 'react';
import api from '../../api.js';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/admin/staff')
      .then((r) => setStaff(r.data.staff))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load staff'));
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Staff Management</h1>
      <div className="row">
        <button onClick={() => { setShow(true); setError(''); }}>Add staff</button>
      </div>
      {error && !show && <div className="error">{error}</div>}
      <div className="card mt">
        <table className="grid">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td><span className="badge blue">{s.role}</span></td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="secondary"
                    onClick={async () => {
                      if (!window.confirm(`Remove ${s.name}?`)) return;
                      await api.delete(`/admin/staff/${s.id}`);
                      load();
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="modal-back" onClick={() => setShow(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add internal staff</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                try {
                  await api.post('/admin/staff', form);
                  setShow(false);
                  setForm({ name: '', email: '', password: '' });
                  load();
                } catch (err) {
                  const issues = err.response?.data?.issues?.map((i) => i.message).join('. ');
                  setError(issues || err.response?.data?.message || 'Failed');
                }
              }}
            >
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <label>Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required />
              <label>Password</label>
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" required />
              <div className="row mt">
                <button type="submit">Create</button>
                <button type="button" className="secondary" onClick={() => setShow(false)}>Cancel</button>
              </div>
              {error && <div className="error">{error}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
