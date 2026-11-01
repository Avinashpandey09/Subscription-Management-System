import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Customer,
  Subscription,
  Invoice,
  NotificationLog,
  ActivityLog,
  SubscriptionPlan,
  AutomationResultSummary,
  BillingInterval,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITIES,
  PLANS,
  TODAY_DATE,
} from '../data/mockData';
import { calculateDaysUntil, calculateRenewalDate, generateInvoiceForSubscription } from '../utils/helpers';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  customers: Customer[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  notifications: NotificationLog[];
  activities: ActivityLog[];
  plans: SubscriptionPlan[];
  lastAutomationSummary: AutomationResultSummary | null;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  removeToast: (id: string) => void;
  createCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'activeSubscriptionsCount'>) => Customer;
  createSubscription: (data: {
    customerId: string;
    planId: string;
    interval: BillingInterval;
    startDate: string;
  }) => { subscription: Subscription; invoice: Invoice };
  runRenewalAutomation: () => Promise<AutomationResultSummary>;
  retryPayment: (subscriptionId: string, simulateSuccess?: boolean) => void;
  simulatePayment: (invoiceId: string, status: 'paid' | 'failed') => void;
  renewSubscription: (subscriptionId: string) => void;
  resetToDemoData: () => void;
  selectedInvoiceForModal: Invoice | null;
  setSelectedInvoiceForModal: (invoice: Invoice | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'smart_sub_sys_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_cust`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_subs`);
    if (saved) return JSON.parse(saved);
    // recalculate daysUntilRenewal based on today
    return INITIAL_SUBSCRIPTIONS.map((s) => ({
      ...s,
      daysUntilRenewal: calculateDaysUntil(s.nextRenewalDate),
    }));
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invs`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifs`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_acts`);
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [lastAutomationSummary, setLastAutomationSummary] = useState<AutomationResultSummary | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_summary`);
    return saved ? JSON.parse(saved) : null;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cust`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_subs`, JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_invs`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_notifs`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_acts`, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    if (lastAutomationSummary) {
      localStorage.setItem(`${STORAGE_KEY}_summary`, JSON.stringify(lastAutomationSummary));
    }
  }, [lastAutomationSummary]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const createCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'activeSubscriptionsCount'>): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: `cust_${Date.now()}`,
      createdAt: TODAY_DATE,
      activeSubscriptionsCount: 0,
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    const newActivity: ActivityLog = {
      id: `act_${Date.now()}`,
      title: 'New Customer Registered',
      description: `Customer ${data.name} (${data.company}) was successfully onboarded.`,
      timestamp: `${TODAY_DATE} 10:00 AM`,
      type: 'customer',
      actor: 'Admin Console',
    };
    setActivities((prev) => [newActivity, ...prev]);

    addToast('success', 'Customer Created', `${newCustomer.name} (${newCustomer.company}) has been added.`);
    return newCustomer;
  };

  const createSubscription = (data: {
    customerId: string;
    planId: string;
    interval: BillingInterval;
    startDate: string;
  }) => {
    const customer = customers.find((c) => c.id === data.customerId);
    const plan = PLANS.find((p) => p.id === data.planId);

    if (!customer || !plan) {
      throw new Error('Invalid customer or plan selection');
    }

    const calculatedRenewal = calculateRenewalDate(data.startDate, data.interval);
    const daysUntil = calculateDaysUntil(calculatedRenewal);
    const amount = data.interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

    const newSubId = `sub_${Date.now()}`;
    const newSub: Subscription = {
      id: newSubId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerCompany: customer.company,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      amount,
      interval: data.interval,
      startDate: data.startDate,
      nextRenewalDate: calculatedRenewal,
      daysUntilRenewal: daysUntil,
      status: 'active',
      autoRenew: true,
      paymentStatus: 'paid',
      retryCount: 0,
      maxRetries: 3,
      lastPaymentDate: data.startDate,
      invoiceIds: [],
    };

    // Generate initial invoice
    const newInvoice = generateInvoiceForSubscription(customer, newSub, plan);
    newInvoice.status = 'paid';
    newInvoice.paidDate = data.startDate;
    newSub.invoiceIds = [newInvoice.id];

    // Update customer active count
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? { ...c, activeSubscriptionsCount: (c.activeSubscriptionsCount || 0) + 1 }
          : c
      )
    );

    setSubscriptions((prev) => [newSub, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);

    // Create Notification & Activity
    const newNotif: NotificationLog = {
      id: `notif_${Date.now()}`,
      type: 'invoice_created',
      title: 'Initial Subscription Invoice Created',
      message: `Invoice ${newInvoice.invoiceNumber} ($${newInvoice.total}) generated for ${customer.company} (${plan.name}).`,
      recipientName: customer.name,
      recipientEmail: customer.email,
      channel: 'email',
      timestamp: `${TODAY_DATE} 10:05 AM`,
      status: 'delivered',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    const newActivity: ActivityLog = {
      id: `act_${Date.now()}`,
      title: 'Subscription Activated',
      description: `Activated ${plan.name} (${data.interval}) for ${customer.company}. Next renewal: ${calculatedRenewal}.`,
      timestamp: `${TODAY_DATE} 10:05 AM`,
      type: 'renewal',
      actor: 'Subscription Engine',
    };
    setActivities((prev) => [newActivity, ...prev]);

    addToast(
      'success',
      'Subscription Activated',
      `Auto-renew date set to ${calculatedRenewal}. Invoice ${newInvoice.invoiceNumber} created.`
    );

    return { subscription: newSub, invoice: newInvoice };
  };

  const runRenewalAutomation = async (): Promise<AutomationResultSummary> => {
    let remindersGenerated = 0;
    let invoicesCreated = 0;
    let failedPaymentsFlagged = 0;
    let renewalsProcessed = 0;
    const details: string[] = [];

    const newNotifications: NotificationLog[] = [];
    const newInvoices: Invoice[] = [];
    const newActivities: ActivityLog[] = [];

    const updatedSubs = subscriptions.map((sub) => {
      const days = calculateDaysUntil(sub.nextRenewalDate);
      const customer = customers.find((c) => c.id === sub.customerId);
      const plan = PLANS.find((p) => p.id === sub.planId);

      // Check Expired / Failed payments
      if (sub.status === 'past_due' || sub.status === 'expired' || sub.paymentStatus === 'failed') {
        failedPaymentsFlagged++;
        details.push(`Flagged failed payment on ${sub.customerCompany} (Retry ${sub.retryCount}/${sub.maxRetries})`);
        return sub;
      }

      // Check Due Today (0 days)
      if (days <= 0 && sub.status === 'active') {
        renewalsProcessed++;
        invoicesCreated++;
        remindersGenerated++;

        if (customer && plan) {
          const inv = generateInvoiceForSubscription(customer, sub, plan);
          newInvoices.push(inv);

          newNotifications.push({
            id: `notif_auto_${Date.now()}_${sub.id}`,
            type: 'renewal_today',
            title: 'Automated Renewal Processed',
            message: `Subscription for ${sub.customerCompany} renewed. Generated invoice ${inv.invoiceNumber} for $${inv.total}.`,
            recipientName: sub.customerName,
            recipientEmail: sub.customerEmail,
            channel: 'email',
            timestamp: `${TODAY_DATE} 08:00 AM`,
            status: 'sent',
          });

          details.push(`Generated renewal invoice ${inv.invoiceNumber} for ${sub.customerCompany}`);
        }
        return {
          ...sub,
          daysUntilRenewal: days,
          paymentStatus: 'pending' as const,
        };
      }

      // Check Due in 7 Days
      if (days > 0 && days <= 7) {
        remindersGenerated++;
        newNotifications.push({
          id: `notif_auto_${Date.now()}_${sub.id}`,
          type: 'renewal_reminder_7d',
          title: '7-Day Renewal Reminder Dispatched',
          message: `Notice sent to ${sub.customerCompany}: Renewal scheduled on ${sub.nextRenewalDate} for $${sub.amount}.`,
          recipientName: sub.customerName,
          recipientEmail: sub.customerEmail,
          channel: 'email',
          timestamp: `${TODAY_DATE} 08:00 AM`,
          status: 'delivered',
        });
        details.push(`Sent 7-day advance reminder to ${sub.customerCompany}`);
      }

      // Check Due in 15 Days
      else if (days > 7 && days <= 15) {
        remindersGenerated++;
        newNotifications.push({
          id: `notif_auto_${Date.now()}_${sub.id}`,
          type: 'renewal_reminder_15d',
          title: '15-Day Renewal Heads-up Dispatched',
          message: `Notice sent to ${sub.customerCompany}: Subscription renewal in 15 days on ${sub.nextRenewalDate}.`,
          recipientName: sub.customerName,
          recipientEmail: sub.customerEmail,
          channel: 'in_app',
          timestamp: `${TODAY_DATE} 08:00 AM`,
          status: 'delivered',
        });
        details.push(`Sent 15-day reminder to ${sub.customerCompany}`);
      }

      // Check Due in 30 Days
      else if (days > 15 && days <= 30) {
        remindersGenerated++;
        newNotifications.push({
          id: `notif_auto_${Date.now()}_${sub.id}`,
          type: 'renewal_reminder_30d',
          title: '30-Day Renewal Pre-notification Sent',
          message: `Notice sent to ${sub.customerCompany}: Annual/monthly term renews on ${sub.nextRenewalDate}.`,
          recipientName: sub.customerName,
          recipientEmail: sub.customerEmail,
          channel: 'email',
          timestamp: `${TODAY_DATE} 08:00 AM`,
          status: 'delivered',
        });
        details.push(`Sent 30-day notice to ${sub.customerCompany}`);
      }

      return {
        ...sub,
        daysUntilRenewal: days,
      };
    });

    const summary: AutomationResultSummary = {
      scannedCount: subscriptions.length,
      remindersGenerated,
      invoicesCreated,
      failedPaymentsFlagged,
      renewalsProcessed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      details,
    };

    newActivities.push({
      id: `act_auto_${Date.now()}`,
      title: 'Full Renewal Automation Cycle Executed',
      description: `Scanned ${subscriptions.length} subs: ${remindersGenerated} reminders sent, ${invoicesCreated} invoices created, ${failedPaymentsFlagged} failed payments audited.`,
      timestamp: `${TODAY_DATE} 08:00 AM`,
      type: 'automation',
      actor: 'Smart Lifecycle Daemon',
    });

    setSubscriptions(updatedSubs);
    if (newInvoices.length > 0) {
      setInvoices((prev) => [...newInvoices, ...prev]);
    }
    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev]);
    }
    setActivities((prev) => [...newActivities, ...prev]);
    setLastAutomationSummary(summary);

    addToast(
      'success',
      'Automation Cycle Complete',
      `${subscriptions.length} subscriptions scanned · ${remindersGenerated} reminders dispatched · ${invoicesCreated} invoices created`
    );

    return summary;
  };

  const retryPayment = (subscriptionId: string, simulateSuccess: boolean = true) => {
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return;

    if (simulateSuccess) {
      // Successful Recovery
      const nextCount = sub.retryCount + 1;
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === subscriptionId
            ? {
                ...s,
                status: 'active',
                paymentStatus: 'paid',
                retryCount: 0,
                nextRetryDate: undefined,
                lastPaymentDate: TODAY_DATE,
              }
            : s
        )
      );

      // Update related invoices
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.subscriptionId === subscriptionId ? { ...inv, status: 'paid', paidDate: TODAY_DATE } : inv
        )
      );

      const newNotif: NotificationLog = {
        id: `notif_${Date.now()}`,
        type: 'retry_attempt',
        title: 'Payment Recovered Successfully',
        message: `Automatic retry #${nextCount} succeeded for ${sub.customerCompany}. Account returned to Active.`,
        recipientName: sub.customerName,
        recipientEmail: sub.customerEmail,
        channel: 'email',
        timestamp: `${TODAY_DATE} 11:30 AM`,
        status: 'delivered',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      const newAct: ActivityLog = {
        id: `act_${Date.now()}`,
        title: 'Dunning Payment Recovered',
        description: `Retry attempt #${nextCount} charged successfully ($${sub.amount}). Churn prevented.`,
        timestamp: `${TODAY_DATE} 11:30 AM`,
        type: 'dunning',
        actor: 'Dunning Recovery Engine',
      };
      setActivities((prev) => [newAct, ...prev]);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      addToast('success', 'Payment Recovered', `Payment of $${sub.amount} collected for ${sub.customerCompany}!`);
    } else {
      // Escalation of Failed Retry
      const nextCount = sub.retryCount + 1;
      const isExhausted = nextCount >= sub.maxRetries;

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === subscriptionId
            ? {
                ...s,
                retryCount: nextCount,
                status: isExhausted ? 'expired' : 'past_due',
                paymentStatus: 'failed',
                nextRetryDate: isExhausted ? 'Exhausted (Marked Expired)' : '2026-11-04 (Attempt 3)',
              }
            : s
        )
      );

      const notifMsg = isExhausted
        ? `Final Retry Attempt #${nextCount} failed for ${sub.customerCompany}. Subscription marked as Expired.`
        : `Retry Attempt #${nextCount} of ${sub.maxRetries} failed for ${sub.customerCompany}. Next attempt scheduled for Nov 4.`;

      const newNotif: NotificationLog = {
        id: `notif_${Date.now()}`,
        type: 'payment_failed_dunning',
        title: isExhausted ? 'All Retry Attempts Exhausted' : `Retry #${nextCount} Failed`,
        message: notifMsg,
        recipientName: sub.customerName,
        recipientEmail: sub.customerEmail,
        channel: 'email',
        timestamp: `${TODAY_DATE} 11:32 AM`,
        status: 'sent',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      addToast(
        'warning',
        isExhausted ? 'Retries Exhausted' : `Retry #${nextCount} Logged`,
        notifMsg
      );
    }
  };

  const simulatePayment = (invoiceId: string, status: 'paid' | 'failed') => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              status,
              paidDate: status === 'paid' ? TODAY_DATE : undefined,
            }
          : i
      )
    );

    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === inv.subscriptionId) {
          return {
            ...s,
            paymentStatus: status,
            status: status === 'paid' ? 'active' : 'past_due',
            retryCount: status === 'failed' ? 1 : 0,
            nextRetryDate: status === 'failed' ? '2026-11-03' : undefined,
          };
        }
        return s;
      })
    );

    if (status === 'paid') {
      confetti({ particleCount: 50, spread: 50 });
      addToast('success', 'Payment Received', `Invoice ${inv.invoiceNumber} marked as Paid.`);
    } else {
      addToast('error', 'Payment Failed', `Invoice ${inv.invoiceNumber} marked Failed. Dunning triggered.`);
    }
  };

  const renewSubscription = (subscriptionId: string) => {
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return;

    const customer = customers.find((c) => c.id === sub.customerId);
    const plan = PLANS.find((p) => p.id === sub.planId);

    const newRenewalDate = calculateRenewalDate(sub.nextRenewalDate, sub.interval);
    const newDays = calculateDaysUntil(newRenewalDate);

    let newInvoice: Invoice | null = null;
    if (customer && plan) {
      newInvoice = generateInvoiceForSubscription(customer, sub, plan);
      newInvoice.status = 'paid';
      newInvoice.paidDate = TODAY_DATE;
      setInvoices((prev) => [newInvoice!, ...prev]);
    }

    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subscriptionId
          ? {
              ...s,
              nextRenewalDate: newRenewalDate,
              daysUntilRenewal: newDays,
              status: 'active',
              paymentStatus: 'paid',
              retryCount: 0,
              nextRetryDate: undefined,
              lastPaymentDate: TODAY_DATE,
              invoiceIds: newInvoice ? [newInvoice.id, ...s.invoiceIds] : s.invoiceIds,
            }
          : s
      )
    );

    const newNotif: NotificationLog = {
      id: `notif_${Date.now()}`,
      type: 'subscription_renewed',
      title: 'Subscription Renewed Successfully',
      message: `${sub.customerCompany} renewed on ${sub.planName}. Next renewal date extended to ${newRenewalDate}.`,
      recipientName: sub.customerName,
      recipientEmail: sub.customerEmail,
      channel: 'email',
      timestamp: `${TODAY_DATE} 12:00 PM`,
      status: 'delivered',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    const newAct: ActivityLog = {
      id: `act_${Date.now()}`,
      title: 'Subscription Manually Renewed',
      description: `Extended renewal cycle for ${sub.customerCompany} to ${newRenewalDate}.`,
      timestamp: `${TODAY_DATE} 12:00 PM`,
      type: 'renewal',
      actor: 'Billing Specialist',
    };
    setActivities((prev) => [newAct, ...prev]);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    addToast(
      'success',
      'Subscription Renewed!',
      `Renewed ${sub.customerCompany}. Next renewal is now ${newRenewalDate}.`
    );
  };

  const resetToDemoData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_cust`);
    localStorage.removeItem(`${STORAGE_KEY}_subs`);
    localStorage.removeItem(`${STORAGE_KEY}_invs`);
    localStorage.removeItem(`${STORAGE_KEY}_notifs`);
    localStorage.removeItem(`${STORAGE_KEY}_acts`);
    localStorage.removeItem(`${STORAGE_KEY}_summary`);

    setCustomers(INITIAL_CUSTOMERS);
    setSubscriptions(
      INITIAL_SUBSCRIPTIONS.map((s) => ({
        ...s,
        daysUntilRenewal: calculateDaysUntil(s.nextRenewalDate),
      }))
    );
    setInvoices(INITIAL_INVOICES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActivities(INITIAL_ACTIVITIES);
    setLastAutomationSummary(null);

    addToast('info', 'Demo State Reset', 'Restored pristine hackathon demo dataset.');
  };

  return (
    <AppContext.Provider
      value={{
        customers,
        subscriptions,
        invoices,
        notifications,
        activities,
        plans: PLANS,
        lastAutomationSummary,
        toasts,
        addToast,
        removeToast,
        createCustomer,
        createSubscription,
        runRenewalAutomation,
        retryPayment,
        simulatePayment,
        renewSubscription,
        resetToDemoData,
        selectedInvoiceForModal,
        setSelectedInvoiceForModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
