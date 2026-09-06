import React, { useState, useEffect } from 'react';
import { formatFullDate, getTodayDateString } from '@/lib/utils';
import { Sun, Moon, Plus, Sparkles, Menu } from 'lucide-react';
import { ActiveTab } from '@/types';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenTransactionModal: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenTransactionModal,
  onToggleMobileMenu,
}) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const syncTheme = () => {
      const isDarkStored =
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkStored);
      if (isDarkStored) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    syncTheme();
    window.addEventListener('theme-changed', syncTheme);
    return () => window.removeEventListener('theme-changed', syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    window.dispatchEvent(new Event('theme-changed'));
  };

  const todayStr = getTodayDateString();

  const titleMap: Record<ActiveTab, string> = {
    dashboard: 'Ringkasan Finansial',
    transactions: 'Riwayat Transaksi',
    wallets: 'Dompet & Rekening',
    budgets: 'Alokasi & Anggaran',
    goals: 'Target Tabungan',
    spaylater: 'Cicilan SPayLater',
    spinjam: 'Cicilan SPinjam',
    recurring: 'Tagihan Rutin',
    reports: 'Laporan & Analitik',
    settings: 'Pengaturan & Cadangan',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 select-none">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 capitalize hidden sm:block">
            {formatFullDate(todayStr)}
          </p>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            {titleMap[activeTab]} <Sparkles className="w-4 h-4 text-[#7b1824] dark:text-rose-400 shrink-0" />
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title={isDark ? 'Beralih ke Terang' : 'Beralih ke Gelap'}
            aria-label="Ganti Tema"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        )}

        <button
          onClick={onOpenTransactionModal}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#7b1824] hover:bg-[#60111b] active:scale-95 text-white font-bold text-xs shadow-sm shadow-[#7b1824]/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah</span>
        </button>
      </div>
    </header>
  );
};
