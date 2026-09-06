import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TransactionModal } from './components/forms/TransactionModal';
import { ToastProvider } from './components/ui/Toast';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { WalletsView } from './views/WalletsView';
import { BudgetsView } from './views/BudgetsView';
import { GoalsView } from './views/GoalsView';
import { SpaylaterView } from './views/SpaylaterView';
import { SpinjamView } from './views/SpinjamView';
import { RecurringView } from './views/RecurringView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { useBudgetStore } from './hooks/useBudgetStore';
import { ActiveTab } from './types';

export default function App() {
  const { isInitialized } = useBudgetStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7b1824] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#7b1824] dark:text-rose-300">
            Menyiapkan basis data keuangan lokal...
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'transactions':
        return <TransactionsView />;
      case 'wallets':
        return <WalletsView />;
      case 'budgets':
        return <BudgetsView />;
      case 'goals':
        return <GoalsView />;
      case 'spaylater':
        return <SpaylaterView />;
      case 'spinjam':
        return <SpinjamView />;
      case 'recurring':
        return <RecurringView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased font-sans">
        {/* Sidebar for Desktop and Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenTransactionModal={() => setIsTxModalOpen(true)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <Header
            activeTab={activeTab}
            onOpenTransactionModal={() => setIsTxModalOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
          <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
            {renderContent()}
          </main>
        </div>

        {/* Global Quick Transaction Modal */}
        <TransactionModal
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
