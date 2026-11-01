import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Play,
  RotateCcw,
  Bell,
  Plus,
  ShieldAlert,
  CreditCard,
  Users,
  FileSpreadsheet,
  LayoutDashboard,
  Calendar,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenAutomation: () => void;
  onOpenCreateCustomer: () => void;
  onOpenCreateSubscription: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenAutomation,
  onOpenCreateCustomer,
  onOpenCreateSubscription,
}) => {
  const { subscriptions, notifications, resetToDemoData } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dueSoonCount = subscriptions.filter(
    (s) => s.daysUntilRenewal >= 0 && s.daysUntilRenewal <= 7 && s.status === 'active'
  ).length;

  const failedCount = subscriptions.filter(
    (s) => s.paymentStatus === 'failed' || s.status === 'past_due'
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'renewals',
      label: 'Renewals',
      icon: Calendar,
      badge: dueSoonCount > 0 ? dueSoonCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'recovery',
      label: 'Recovery & Dunning',
      icon: ShieldAlert,
      badge: failedCount > 0 ? failedCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'about', label: 'Problem & Solution', icon: Info, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-extrabold text-base tracking-wider">
                SS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    SmartSub
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    v2.4
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                  Automated Lifecycle Engine
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : item.highlight
                      ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : ''}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Demo Run Automation Button */}
            <button
              onClick={onOpenAutomation}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
              title="Run end-to-end renewal automation cycle"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Automation</span>
            </button>

            {/* Reset Demo Button */}
            <button
              onClick={resetToDemoData}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Reset state to initial pristine demo dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Demo</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 text-slate-100 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-xs text-white">
                        Automated Notification History
                      </span>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">
                        No notification logs yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white truncate max-w-[200px]">
                              {notif.title}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 uppercase">
                              {notif.channel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {notif.message}
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                            {notif.timestamp}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              aria-label="Toggle menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800 grid grid-cols-2 gap-1 animate-in fade-in duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-950/60">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
