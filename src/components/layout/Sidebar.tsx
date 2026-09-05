import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Target,
  Repeat,
  BarChart3,
  Settings,
  PlusCircle,
  X,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { ActiveTab } from '@/types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenTransactionModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenTransactionModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { calculateSummary } = useBudgetStore();
  const summary = calculateSummary();

  const navItems: { label: string; id: ActiveTab; icon: any }[] = [
    { label: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { label: 'Transaksi', id: 'transactions', icon: Receipt },
    { label: 'Dompet & Akun', id: 'wallets', icon: Wallet },
    { label: 'Anggaran', id: 'budgets', icon: PieChart },
    { label: 'Target Tabungan', id: 'goals', icon: Target },
    { label: 'Tagihan Rutin', id: 'recurring', icon: Repeat },
    { label: 'Laporan & Analisis', id: 'reports', icon: BarChart3 },
    { label: 'Pengaturan & Backup', id: 'settings', icon: Settings },
  ];

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 h-screen select-none transition-transform duration-300 z-50',
          'fixed inset-y-0 left-0 md:sticky md:top-0 md:translate-x-0',
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#68101c] via-[#7b1824] to-[#a82233] flex items-center justify-center text-white shadow-md shadow-[#7b1824]/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                Tracker Budget
              </h1>
              <p className="text-[11px] text-[#7b1824] dark:text-rose-400 font-medium">
                Personal Finance Desktop
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => {
            onOpenTransactionModal();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#7b1824] hover:bg-[#60111b] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-[#7b1824]/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Catat Transaksi
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-left',
                  isActive
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-[#7b1824] dark:text-rose-300 font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-[#7b1824] dark:text-rose-400' : 'text-zinc-400')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mini Balance Card in Sidebar footer */}
        <div className="mt-auto pt-4 border-t border-rose-100/60 dark:border-zinc-800/80">
          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-zinc-900/60 border border-rose-100 dark:border-rose-950/60">
            <p className="text-[11px] font-semibold text-[#7b1824] dark:text-rose-400">
              Total Kekayaan Bersih
            </p>
            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
              {formatCurrency(summary.totalBalance)}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
