import React from 'react';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Landmark, Sparkles, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ActiveTab } from '@/types';

interface CategoryFilterBarProps {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  totalInvestments: number;
  onNavigate: (tab: ActiveTab) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  totalIncome,
  totalExpense,
  totalSavings,
  totalInvestments,
  onNavigate,
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = [
    {
      id: 'income',
      title: 'Pemasukan',
      subtitle: 'Income Stream',
      amount: totalIncome,
      icon: ArrowDownLeft,
      targetTab: 'transactions' as ActiveTab,
      badge: 'Kas Masuk',
      colorScheme: 'hover:border-emerald-300 dark:hover:border-emerald-800',
      iconBg: 'bg-rose-50 text-[#7b1824] dark:bg-[#340b12] dark:text-rose-300',
    },
    {
      id: 'expense',
      title: 'Pengeluaran',
      subtitle: 'Daily Expenses',
      amount: totalExpense,
      icon: ArrowUpRight,
      targetTab: 'transactions' as ActiveTab,
      badge: 'Beban Biaya',
      colorScheme: 'hover:border-rose-300 dark:hover:border-rose-800',
      iconBg: 'bg-rose-100/70 text-[#8d1827] dark:bg-[#420d16] dark:text-rose-200',
    },
    {
      id: 'savings',
      title: 'Tabungan',
      subtitle: 'Savings & Vault',
      amount: totalSavings,
      icon: PiggyBank,
      targetTab: 'goals' as ActiveTab,
      badge: 'Dana Aman',
      colorScheme: 'hover:border-amber-300 dark:hover:border-amber-800',
      iconBg: 'bg-amber-50 text-[#7b1824] dark:bg-[#38160d] dark:text-amber-300',
    },
    {
      id: 'investment',
      title: 'Investasi',
      subtitle: 'Investments',
      amount: totalInvestments,
      icon: Landmark,
      targetTab: 'wallets' as ActiveTab,
      badge: 'Portofolio',
      colorScheme: 'hover:border-purple-300 dark:hover:border-purple-800',
      iconBg: 'bg-rose-50 text-[#7b1824] dark:bg-[#280d21] dark:text-pink-300',
    },
  ];

  return (
    <section className="space-y-3.5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8d1827] dark:text-rose-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alokasi Finansial</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Kategori & Pos Utama
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Pilih pos keuangan untuk meninjau alokasi atau melihat riwayat transaksi detail
          </p>
        </div>

        <button
          onClick={() => onNavigate('budgets')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#8d1827] dark:text-rose-400 hover:text-[#5a0c16] dark:hover:text-rose-300 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Kelola Semua Alokasi</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Category Tiles (Gaya Menu di Mockup Dakingo) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory(cat.id);
                } else {
                  onNavigate(cat.targetTab);
                }
              }}
              className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-[#8d1827] ring-2 ring-[#8d1827]/20 shadow-md'
                  : 'border-rose-100/70 dark:border-zinc-800/80 ' + cat.colorScheme
              }`}
            >
              {/* Top Row: Icon + Badge */}
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs border border-rose-200/50 dark:border-rose-900/40 ${cat.iconBg}`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#8d1827] dark:text-rose-300 border border-rose-100 dark:border-rose-900/50 uppercase tracking-wide">
                  {cat.badge}
                </span>
              </div>

              {/* Bottom Row: Title + Amount */}
              <div className="mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {cat.title}
                </h3>
                <p className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                  {formatCurrency(cat.amount)}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                  <span>{cat.subtitle}</span>
                </p>
              </div>

              {/* Bottom Subtle Bar Indicator */}
              <div className="mt-3 w-full h-1 rounded-full bg-rose-50 dark:bg-zinc-800 overflow-hidden">
                <div className="w-full h-full bg-[#8d1827] dark:bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
