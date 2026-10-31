import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import StaffManagement from './pages/admin/StaffManagement.jsx';
import ProductsPage from './pages/admin/ProductsPage.jsx';
import PlansPage from './pages/admin/PlansPage.jsx';
import TaxesDiscountsPage from './pages/admin/TaxesDiscountsPage.jsx';
import SubscriptionsPage from './pages/staff/SubscriptionsPage.jsx';
import SubscriptionDetail from './pages/staff/SubscriptionDetail.jsx';
import InvoicesPage from './pages/staff/InvoicesPage.jsx';
import PaymentsPage from './pages/staff/PaymentsPage.jsx';
import DashboardPage from './pages/finance/DashboardPage.jsx';
import CustomerPortal from './pages/customer/CustomerPortal.jsx';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'customer') return <Navigate to="/portal" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/staff" replace />;
  return <Navigate to="/staff/subscriptions" replace />;
}

const wrap = (roles, el) => (
  <ProtectedRoute roles={roles}>
    <Layout>{el}</Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/admin/staff" element={wrap(['admin'], <StaffManagement />)} />
          <Route path="/admin/products" element={wrap(['admin'], <ProductsPage />)} />
          <Route path="/admin/plans" element={wrap(['admin'], <PlansPage />)} />
          <Route path="/admin/taxes-discounts" element={wrap(['admin'], <TaxesDiscountsPage />)} />

          <Route path="/staff/subscriptions" element={wrap(['admin', 'staff'], <SubscriptionsPage />)} />
          <Route path="/staff/subscriptions/:id" element={wrap(['admin', 'staff'], <SubscriptionDetail />)} />
          <Route path="/staff/invoices" element={wrap(['admin', 'staff'], <InvoicesPage />)} />
          <Route path="/staff/payments" element={wrap(['admin', 'staff'], <PaymentsPage />)} />

          <Route path="/finance" element={wrap(['admin', 'staff'], <DashboardPage />)} />
          <Route path="/portal" element={wrap(['customer'], <CustomerPortal />)} />

          <Route path="/" element={<Home />} />
          <Route path="*" element={<div className="center">Not found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
