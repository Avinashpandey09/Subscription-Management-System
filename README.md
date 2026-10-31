# Subscription Management System

Full-stack subscription billing app: auth + RBAC, product/plan catalog, quotation
lifecycle, automated billing, payments, finance dashboard, and a customer portal.

- **server/** — Node + Express + Mongoose API (Modules 1–6 backend)
- **client/** — React + Vite + React Router + Recharts (Modules 1–6 frontend)

## Prerequisites

- Node.js 20+ and npm
- MongoDB (local `mongod` or a MongoDB Atlas connection string)

## Quick start

```bash
# 1. API
cd server
cp .env.example .env        # then set MONGO_URI + JWT_SECRET
npm install
npm run seed                # demo users, catalog, 1,100+ subscriptions + invoices
npm run dev                 # API on http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # app on http://localhost:5173
```

Open **http://localhost:5173** in a browser. Seed logins (password `Demo@1234`):

| Role     | Email               |
|----------|---------------------|
| admin    | admin@demo.local    |
| staff    | staff@demo.local    |
| customer | customer@demo.local |

## Module map

| # | Module | Backend (`server/src/`) | Frontend (`client/src/`) |
|---|--------|-------------------------|--------------------------|
| 1 | Auth, RBAC, staff | `models/User.js`, `models/PasswordReset.js`, `middleware/auth.js`, `middleware/rbac.js`, `services/auth.service.js`, `routes/auth.routes.js` + `routes/admin.routes.js`, `controllers/auth.controller.js` | `auth/AuthContext.jsx`, `auth/ProtectedRoute.jsx`, `pages/Login.jsx`, `pages/Signup.jsx`, `pages/ForgotPassword.jsx`, `pages/ResetPassword.jsx`, `pages/admin/StaffManagement.jsx` |
| 2 | Catalog, plans, taxes, discounts | Product records and variants: `server/models/product.py`, `server/schemas/products.py`, `server/routes/catalog.py` | `client/src/pages/admin/ProductsPage.jsx`, `pages/admin/PlansPage.jsx`, `pages/admin/TaxesDiscountsPage.jsx` |
| 3 | Quotations & lifecycle | `models/QuotationTemplate.js`, `models/Subscription.js`, `utils/numbering.js`, `routes/subscription.routes.js`, `controllers/subscription.controller.js` | `pages/staff/SubscriptionsPage.jsx`, `pages/staff/SubscriptionDetail.jsx` |
| 4 | Billing & invoicing | `models/Invoice.js`, `services/billing.service.js`, `jobs/billing.cron.js`, `utils/pdf.js`, `routes/invoice.routes.js`, `controllers/invoice.controller.js` | `pages/staff/InvoicesPage.jsx` |
| 5 | Payments | `models/Payment.js`, `services/payment.service.js`, `routes/payment.routes.js`, `controllers/payment.controller.js` | `pages/staff/PaymentsPage.jsx`, `pages/staff/RecordPaymentModal.jsx` |
| 6 | Dashboard & portal | `services/dashboard.service.js`, `routes/dashboard.routes.js`, `utils/seed.js` | `pages/finance/DashboardPage.jsx`, `pages/customer/CustomerPortal.jsx` |

Note: `POST /api/admin/staff` (admin-only staff creation) lives in
`routes/admin.routes.js` and is handled by `auth.controller.createStaffHandler`.

## Key API routes

- `POST /api/auth/signup|login|logout`, `GET /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `POST /api/admin/staff` (admin only)
- `GET /api/catalog/products` supports `page`, `pageSize`, and `isActive` query parameters; `GET /api/catalog/products/{id}` includes variant final prices; product writes and status changes are admin-only
- `/api/catalog/plans|taxes|discounts` (GET open, writes admin-only)
- `/api/subscriptions`, `/api/subscriptions/from-template/:id`, `PATCH /:id/status`, `POST /:id/renew`
- `/api/invoices`, `POST /api/invoices/run-billing`, `GET /:id/pdf`, `POST /:id/send`
- `/api/payments`, `GET /api/dashboard`

## Design notes

- **Money is integer paise** in every model; the UI converts to/from rupees.
- **JWT in an httpOnly cookie** (`token`); customers are strictly isolated via
  `enforceCustomerScope` (`customerId = req.user.id`), ignoring crafted query params.
- **Subscription lifecycle**: Draft → Quotation → Confirmed → Active → Closed;
  Paused only when the plan is pausable. Activating sets `nextInvoiceDate = startDate`.
- **Billing is idempotent**: unique `{ subscriptionId, periodStart }` index, one
  period advance per run, atomic discount `$inc` with `usedCount < usageLimit`.
- **Invoices**: Draft → Confirmed → Paid (Paid only via payments), plus Cancelled.
  Overdue = `dueDate < today` on Draft/Confirmed invoices.
- **Billing cron**: schedule via `BILLING_CRON` (default daily 02:00); empty disables.
- **Email**: configure `SMTP_*` in `.env`; without it, mails log to the console
  (dev fallback) so password resets still work end-to-end for testing.
- **Dashboard** uses indexed aggregates + `.lean()` and reports its own
  `durationMs` against the < 2 s target.

## Tests

```bash
cd server && npm test   # DB-free unit tests (discounts, lifecycle, periods, passwords)
```
