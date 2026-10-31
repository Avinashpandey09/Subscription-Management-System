import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [];
  if (user?.role === 'admin') {
    links.push(
      ['/admin/staff', 'Staff'],
      ['/admin/products', 'Products'],
      ['/admin/plans', 'Plans'],
      ['/admin/taxes-discounts', 'Taxes & Discounts'],
      ['/staff/subscriptions', 'Subscriptions'],
      ['/staff/invoices', 'Invoices'],
      ['/staff/payments', 'Payments'],
      ['/finance', 'Dashboard']
    );
  } else if (user?.role === 'staff') {
    links.push(
      ['/staff/subscriptions', 'Subscriptions'],
      ['/staff/invoices', 'Invoices'],
      ['/staff/payments', 'Payments'],
      ['/finance', 'Dashboard']
    );
  } else {
    links.push(['/portal', 'My Subscriptions']);
  }

  return (
    <div className="shell">
      <nav className="sidebar">
        <h2>Subscriptions</h2>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {label}
          </NavLink>
        ))}
        <div className="who">
          {user?.name} ({user?.role})
          <br />
          <button
            className="linklike"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
