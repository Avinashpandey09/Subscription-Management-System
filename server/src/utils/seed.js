// Seed script: wipes the DB and seeds demo users, catalog, 1,000+
// subscriptions + invoices so the < 2s dashboard target can be evaluated.
// Run: npm run seed  (or: node src/utils/seed.js)
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Plan from '../models/Plan.js';
import Tax from '../models/Tax.js';
import Discount from '../models/Discount.js';
import QuotationTemplate from '../models/QuotationTemplate.js';
import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Counter from '../models/Counter.js';
import PasswordReset from '../models/PasswordReset.js';
import { runBilling } from '../services/billing.service.js';
import { recordPayment } from '../services/payment.service.js';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  await connectDB();
  console.log('Wiping collections...');
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Plan.deleteMany({}),
    Tax.deleteMany({}),
    Discount.deleteMany({}),
    QuotationTemplate.deleteMany({}),
    Subscription.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    Counter.deleteMany({}),
    PasswordReset.deleteMany({})
  ]);

  const hash = await bcrypt.hash('Demo@1234', 10);
  const admin = await User.create({ name: 'Admin', email: 'admin@demo.local', passwordHash: hash, role: 'admin' });
  const staff = await User.create({ name: 'Staff Member', email: 'staff@demo.local', passwordHash: hash, role: 'staff' });
  const demoCustomer = await User.create({ name: 'Demo Customer', email: 'customer@demo.local', passwordHash: hash, role: 'customer' });
  const customers = [demoCustomer];
  for (let i = 1; i <= 40; i++) {
    customers.push(
      await User.create({ name: `Customer ${i}`, email: `customer${i}@demo.local`, passwordHash: hash, role: 'customer' })
    );
  }
  console.log(`Users: admin/staff/customer + ${customers.length - 1} generated (password for all: Demo@1234)`);

  const products = await Product.insertMany([
    {
      name: 'ERP License',
      type: 'license',
      salesPrice: 499900,
      costPrice: 100000,
      notes: 'Per-seat ERP license',
      variants: [
        { attribute: 'Brand', value: 'Odoo', extraPrice: 56000 },
        { attribute: 'Brand', value: 'Standard', extraPrice: 0 }
      ]
    },
    { name: 'Cloud Hosting', type: 'service', salesPrice: 199900, costPrice: 80000, notes: 'Managed hosting' },
    {
      name: 'Support Pack',
      type: 'service',
      salesPrice: 99900,
      costPrice: 20000,
      variants: [
        { attribute: 'Tier', value: 'Priority', extraPrice: 50000 },
        { attribute: 'Tier', value: 'Basic', extraPrice: 0 }
      ]
    },
    { name: 'Onboarding', type: 'one-time', salesPrice: 250000, costPrice: 50000 },
    { name: 'Extra Storage 100GB', type: 'addon', salesPrice: 49900, costPrice: 10000 }
  ]);

  const plans = await Plan.insertMany([
    { name: 'Starter Monthly', price: 99900, billingPeriod: 'monthly', minQty: 1, closable: true, pausable: true, renewable: true },
    { name: 'Growth Monthly', price: 249900, billingPeriod: 'monthly', minQty: 1, closable: true, pausable: true, renewable: true, autoClose: false },
    { name: 'Annual Saver', price: 999900, billingPeriod: 'yearly', minQty: 1, closable: false, pausable: false, renewable: true, autoClose: true },
    { name: 'Weekly Flex', price: 29900, billingPeriod: 'weekly', minQty: 5, closable: true, pausable: true, renewable: false }
  ]);

  await Tax.insertMany([
    { name: 'GST', rate: 18, rules: { minAmount: 0, appliesTo: 'all' } },
    { name: 'Service Cess', rate: 2, rules: { minAmount: 500000, appliesTo: 'subscription' } }
  ]);

  await Discount.insertMany([
    { name: 'Welcome 10%', code: 'WELCOME10', type: 'percent', value: 10, minPurchase: 50000, startDate: ago(365), endDate: ago(-365), usageLimit: 0, appliesTo: 'subscription' },
    { name: 'Flat Rs 500 off', code: 'FLAT500', type: 'fixed', value: 50000, minPurchase: 200000, startDate: ago(365), endDate: ago(-365), usageLimit: 10000, appliesTo: 'subscription' }
  ]);

  await QuotationTemplate.create({
    name: 'Standard Starter Quote',
    plan: plans[0]._id,
    productLines: [
      { productId: products[0]._id, qty: 2, variantIndex: 0 },
      { productId: products[2]._id, qty: 1, variantIndex: -1 }
    ],
    validityDays: 30
  });

  // --- 1,100 subscriptions ---
  console.log('Seeding subscriptions...');
  const subs = [];
  const N = 1100;
  for (let i = 1; i <= N; i++) {
    const plan = pick(plans);
    const status = i <= 800 ? 'Active' : i <= 875 ? 'Draft' : i <= 925 ? 'Quotation' : i <= 975 ? 'Confirmed' : i <= 1025 ? 'Paused' : 'Closed';
    const product = pick(products);
    const qty = 1 + Math.floor(Math.random() * 4);
    subs.push({
      number: `SUB-${String(i).padStart(4, '0')}`,
      customerId: pick(customers)._id,
      planId: plan._id,
      startDate: ago(60 + Math.floor(Math.random() * 300)),
      paymentTerms: 'Net 15',
      paymentTermsDays: 15,
      lines: [{ productId: product._id, name: product.name, qty, unitPrice: product.salesPrice, amount: qty * product.salesPrice }],
      status,
      // ~500 Active subs are due for billing (past nextInvoiceDate => overdue invoices)
      nextInvoiceDate: status === 'Active' && i <= 500 ? ago(20 + Math.floor(Math.random() * 40)) : ago(-Math.floor(Math.random() * 30))
    });
  }
  // Demo customer showcase subscriptions
  const demoSubs = [
    { number: 'SUB-9001', customerId: demoCustomer._id, planId: plans[1]._id, startDate: ago(90), lines: [], status: 'Active', nextInvoiceDate: ago(45) },
    { number: 'SUB-9002', customerId: demoCustomer._id, planId: plans[0]._id, startDate: ago(10), lines: [], status: 'Confirmed', nextInvoiceDate: null },
    { number: 'SUB-9003', customerId: demoCustomer._id, planId: plans[2]._id, startDate: ago(400), lines: [], status: 'Closed', nextInvoiceDate: null }
  ];
  for (const d of demoSubs) subs.push({ paymentTerms: 'Net 15', paymentTermsDays: 15, ...d });
  await Subscription.insertMany(subs);
  await Counter.create({ key: 'subscription', seq: 9100 });
  console.log(`Seeded ${subs.length} subscriptions`);

  // --- Billing run: generates Draft invoices for due subscriptions ---
  console.log('Running billing...');
  const billing = await runBilling(new Date());
  console.log('Billing:', JSON.stringify(billing));

  // --- Reconcile: confirm most, pay many (spread over 6 months), leave overdue ---
  const invoices = await Invoice.find().sort({ createdAt: 1 });
  await Counter.findOneAndUpdate({ key: 'invoice' }, { seq: 10000 + invoices.length }, { upsert: true });
  let paid = 0;
  let n = 0;
  for (const inv of invoices) {
    n += 1;
    if (n % 10 === 0) continue; // leave ~10% untouched (overdue Drafts)
    inv.status = 'Confirmed';
    await inv.save();
    if (n % 10 <= 6) {
      // full payment, backdated across the last 6 months for the revenue chart
      const backdate = new Date();
      backdate.setMonth(backdate.getMonth() - (n % 6), Math.max(1, (n * 7) % 27));
      await recordPayment({
        invoiceId: inv._id,
        method: pick(['Card', 'UPI', 'Bank Transfer', 'Cash']),
        amount: inv.total,
        date: backdate,
        note: 'Seed payment',
        recordedBy: staff._id
      });
      paid += 1;
    } else if (n % 10 <= 8) {
      // partial payment
      await recordPayment({
        invoiceId: inv._id,
        method: 'UPI',
        amount: Math.floor(inv.total / 2),
        date: ago(5),
        note: 'Seed partial payment',
        recordedBy: staff._id
      });
    }
    // else: confirmed but unpaid (outstanding / overdue)
  }
  console.log(`Invoices: ${invoices.length}, paid in full: ${paid}`);
  console.log('Done. Logins (password Demo@1234): admin@demo.local, staff@demo.local, customer@demo.local');

  await mongoose.disconnect();
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('utils/seed.js');

if (isMain) {
  main().catch(async (e) => {
    console.error('Seed failed:', e);
    await mongoose.disconnect();
    process.exit(1);
  });
}

export default main;
