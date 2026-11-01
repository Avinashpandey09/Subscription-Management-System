import { Customer, Invoice, Subscription, SubscriptionPlan } from '../types';

export const TODAY_ISO = '2026-11-01';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function calculateRenewalDate(startDateStr: string, interval: 'monthly' | 'yearly'): string {
  try {
    const [year, month, day] = startDateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (interval === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return '2026-12-01';
  }
}

export function calculateDaysUntil(dateStr: string): number {
  try {
    const [y1, m1, d1] = TODAY_ISO.split('-').map(Number);
    const [y2, m2, d2] = dateStr.split('-').map(Number);
    const today = new Date(y1, m1 - 1, d1).getTime();
    const target = new Date(y2, m2 - 1, d2).getTime();
    const diffMs = target - today;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function generateInvoiceForSubscription(
  customer: Customer,
  subscription: Subscription,
  plan: SubscriptionPlan
): Invoice {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-2026-${randomSuffix}`;
  
  const subtotal = subscription.amount;
  const taxRate = 0.09; // 9% average sales tax
  const taxAmount = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));

  const periodStart = subscription.nextRenewalDate;
  const periodEnd = calculateRenewalDate(periodStart, subscription.interval);

  return {
    id: `inv_${Date.now()}_${randomSuffix}`,
    invoiceNumber,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerCompany: customer.company,
    customerAddress: `${customer.address}, ${customer.city}, ${customer.country}`,
    subscriptionId: subscription.id,
    planName: plan.name,
    periodStart,
    periodEnd,
    items: [
      {
        description: `${plan.name} (${subscription.interval === 'monthly' ? 'Monthly' : 'Annual'} Subscription Cycle)`,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal,
      },
      {
        description: 'Automated Lifecycle & Dunning Protection Infrastructure',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
    subtotal,
    taxRate,
    taxAmount,
    total,
    issueDate: TODAY_ISO,
    dueDate: TODAY_ISO,
    status: 'pending',
    paymentMethod: 'Credit Card / ACH on File',
  };
}

export function downloadInvoiceAsFile(invoice: Invoice): void {
  const content = `===============================================================
SMART SUBSCRIPTION MANAGEMENT SYSTEM - TAX INVOICE
===============================================================
Invoice Number : ${invoice.invoiceNumber}
Issue Date     : ${invoice.issueDate}
Due Date       : ${invoice.dueDate}
Status         : ${invoice.status.toUpperCase()}
Payment Method : ${invoice.paymentMethod}

---------------------------------------------------------------
CUSTOMER & BILLING DETAILS:
---------------------------------------------------------------
Customer Name  : ${invoice.customerName}
Company        : ${invoice.customerCompany}
Email          : ${invoice.customerEmail}
Billing Address: ${invoice.customerAddress}
Subscription ID: ${invoice.subscriptionId}
Billing Period : ${invoice.periodStart} to ${invoice.periodEnd}

---------------------------------------------------------------
ITEMIZED CHARGES:
---------------------------------------------------------------
${invoice.items
  .map(
    (item, index) =>
      `${index + 1}. ${item.description.padEnd(45)} x${item.quantity}  $${item.total.toFixed(2)}`
  )
  .join('\n')}

---------------------------------------------------------------
FINANCIAL SUMMARY:
---------------------------------------------------------------
Subtotal       : $${invoice.subtotal.toFixed(2)}
Tax (${(invoice.taxRate * 100).toFixed(1)}%)     : $${invoice.taxAmount.toFixed(2)}
---------------------------------------------------------------
TOTAL PAYABLE  : $${invoice.total.toFixed(2)}
===============================================================
Thank you for your business!
Smart Subscription Management System · Automated Dunning & Renewals
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoiceNumber}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
