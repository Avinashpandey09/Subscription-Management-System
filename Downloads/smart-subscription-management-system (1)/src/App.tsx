import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RenewalsView } from './components/RenewalsView';
import { FailedPaymentRecoveryView } from './components/FailedPaymentRecoveryView';
import { InvoicesView } from './components/InvoicesView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { CustomersView } from './components/CustomersView';
import { AboutSolutionView } from './components/AboutSolutionView';
import { AutomationModal } from './components/AutomationModal';
import { CreateCustomerModal } from './components/CreateCustomerModal';
import { CreateSubscriptionModal } from './components/CreateSubscriptionModal';
import { InvoiceModal } from './components/InvoiceModal';
import { ToastContainer } from './components/ToastContainer';
import { TODAY_DATE } from './data/mockData';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAutomationOpen, setIsAutomationOpen] = useState<boolean>(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState<boolean>(false);
  const [isCreateSubscriptionOpen, setIsCreateSubscriptionOpen] = useState<boolean>(false);
  const [selectedCustomerIdForSub, setSelectedCustomerIdForSub] = useState<string | undefined>(undefined);

  const { selectedInvoiceForModal, setSelectedInvoiceForModal } = useApp();

  const handleOpenCreateSubscriptionWithCustomer = (customerId: string) => {
    setSelectedCustomerIdForSub(customerId);
    setIsCreateSubscriptionOpen(true);
  };

  const handleOpenCreateSubscription = () => {
    setSelectedCustomerIdForSub(undefined);
    setIsCreateSubscriptionOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenAutomation={() => setIsAutomationOpen(true)}
        onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
        onOpenCreateSubscription={handleOpenCreateSubscription}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAutomation={() => setIsAutomationOpen(true)}
            onOpenCreateSubscription={handleOpenCreateSubscription}
            onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
          />
        )}

        {currentTab === 'renewals' && (
          <RenewalsView
            onOpenAutomation={() => setIsAutomationOpen(true)}
            onOpenInvoiceModal={(invoiceId) => {
              // Open modal handled by context
            }}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'recovery' && <FailedPaymentRecoveryView />}

        {currentTab === 'invoices' && (
          <InvoicesView onOpenCreateSubscription={handleOpenCreateSubscription} />
        )}

        {currentTab === 'subscriptions' && (
          <SubscriptionsView
            onOpenCreateSubscription={handleOpenCreateSubscription}
            onOpenRenewals={() => setCurrentTab('renewals')}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersView
            onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
            onOpenCreateSubscriptionWithCustomer={handleOpenCreateSubscriptionWithCustomer}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'about' && (
          <AboutSolutionView
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAutomation={() => setIsAutomationOpen(true)}
            onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
            onOpenCreateSubscription={handleOpenCreateSubscription}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <AutomationModal
        isOpen={isAutomationOpen}
        onClose={() => setIsAutomationOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      <CreateCustomerModal
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
      />

      <CreateSubscriptionModal
        isOpen={isCreateSubscriptionOpen}
        onClose={() => setIsCreateSubscriptionOpen(false)}
        defaultCustomerId={selectedCustomerIdForSub}
      />

      <InvoiceModal
        invoice={selectedInvoiceForModal}
        onClose={() => setSelectedInvoiceForModal(null)}
      />

      {/* Toast Feedback Stack */}
      <ToastContainer />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smart Subscription Management System · Hackathon Edition</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Simulation Anchor Date: <strong className="text-slate-300">{TODAY_DATE}</strong></span>
            <span>·</span>
            <button
              onClick={() => setCurrentTab('about')}
              className="text-indigo-400 hover:text-indigo-300 font-sans"
            >
              Problem vs Solution Guide
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
