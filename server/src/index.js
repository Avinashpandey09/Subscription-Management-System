import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Module 1: auth + staff management
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Module 2: catalog (products, plans, taxes, discounts)
app.use('/api/catalog', catalogRoutes);

// Module 3: subscriptions & quotation templates
app.use('/api/subscriptions', subscriptionRoutes);

// Module 4: billing engine & invoicing
app.use('/api/invoices', invoiceRoutes);

// Module 5: payments & reconciliation
app.use('/api/payments', paymentRoutes);

// Module 6: finance dashboard
app.use('/api/dashboard', dashboardRoutes);

// Central error handler (incl. Zod validation errors)
 // eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.issues) return res.status(400).json({ message: 'Validation failed', issues: err.issues });
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(async () => {
      const { startBillingCron } = await import('./jobs/billing.cron.js');
      startBillingCron();
      app.listen(PORT, () => console.log(`API listening on :${PORT}`));
    })
    .catch((e) => {
      console.error('Startup failed:', e.message);
      process.exit(1);
    });
}

export default app;
