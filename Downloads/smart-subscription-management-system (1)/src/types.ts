export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'past_due' | 'expired' | 'canceled';
export type PaymentStatus = 'paid' | 'pending' | 'failed';

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  avatar: string;
  createdAt: string;
  activeSubscriptionsCount?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  tier: 'Starter' | 'Professional' | 'Enterprise';
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  description: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  planId: string;
  planName: string;
  tier: 'Starter' | 'Professional' | 'Enterprise';
  amount: number;
  interval: BillingInterval;
  startDate: string;
  nextRenewalDate: string;
  daysUntilRenewal: number; // calculated relative to today (2026-11-01)
  status: SubscriptionStatus;
  autoRenew: boolean;
  paymentStatus: PaymentStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryDate?: string;
  lastPaymentDate?: string;
  invoiceIds: string[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  customerAddress: string;
  subscriptionId: string;
  planName: string;
  periodStart: string;
  periodEnd: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // e.g., 0.10 for 10%
  taxAmount: number;
  total: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'failed' | 'overdue';
  paymentMethod: string;
}

export type NotificationChannel = 'email' | 'sms' | 'in_app';
export type NotificationType = 
  | 'renewal_reminder_30d' 
  | 'renewal_reminder_15d' 
  | 'renewal_reminder_7d' 
  | 'renewal_today' 
  | 'invoice_created' 
  | 'payment_failed_dunning' 
  | 'subscription_renewed' 
  | 'retry_attempt';

export interface NotificationLog {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientName: string;
  recipientEmail: string;
  channel: NotificationChannel;
  timestamp: string;
  status: 'sent' | 'delivered';
  relatedEntityId?: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'automation' | 'renewal' | 'invoice' | 'payment' | 'customer' | 'dunning';
  actor: string;
}

export interface AutomationResultSummary {
  scannedCount: number;
  remindersGenerated: number;
  invoicesCreated: number;
  failedPaymentsFlagged: number;
  renewalsProcessed: number;
  timestamp: string;
  details: string[];
}
