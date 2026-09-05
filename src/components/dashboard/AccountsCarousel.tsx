import React from 'react';
import { Card, CardTitle } from '../ui/Card';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency } from '@/lib/utils';
import { Account, ActiveTab } from '@/types';
import { Plus, ArrowRight } from 'lucide-react';

interface AccountsCarouselProps {
  accounts: Account[];
  onAddAccount: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const AccountsCarousel: React.FC<AccountsCarouselProps> = ({
  accounts,
  onAddAccount,
  onNavigate,
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <CardTitle>Dompet & Rekening</CardTitle>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
            {accounts.length} Akun
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddAccount}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-1 rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
          <button
            onClick={() => onNavigate('wallets')}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-0.5 ml-2 cursor-pointer"
          >
            <span>Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            onClick={() => onNavigate('wallets')}
            className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/80 transition-all flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: acc.color }}
              >
                <DynamicIcon name={acc.icon} className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                {acc.type}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {acc.name}
              </p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {formatCurrency(acc.balance)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
