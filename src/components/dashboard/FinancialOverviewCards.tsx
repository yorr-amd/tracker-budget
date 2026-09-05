import React from 'react';
import {
  Wallet,
  TrendingDown,
  Target,
  PiggyBank,
  ArrowRight,
  ShieldCheck,
  Star,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ActiveTab, FinancialSummary, SavingsGoal, Budget } from '@/types';

interface FinancialOverviewCardsProps {
  summary: FinancialSummary;
  accountsCount: number;
  budgets: Budget[];
  goals: SavingsGoal[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenBudgetModal?: () => void;
  onOpenGoalModal?: () => void;
}

export const FinancialOverviewCards: React.FC<FinancialOverviewCardsProps> = ({
  summary,
  accountsCount,
  budgets,
  goals,
  onNavigate,
}) => {
  // Hitung total limit budget
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + (b.amountLimit || 0), 0);
  const budgetUsagePercent =
    totalBudgetLimit > 0 ? Math.min(100, Math.round((summary.totalExpense / totalBudgetLimit) * 100)) : 0;

  // Ambil target tabungan prioritas terdekat
  const primaryGoal = goals.find((g) => !g.isCompleted) || goals[0];
  const goalProgress =
    primaryGoal && primaryGoal.targetAmount > 0
      ? Math.min(100, Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100))
      : 0;

  // Rasio tabungan
  const savingsRate =
    summary.totalIncome > 0
      ? Math.max(0, Math.round((summary.netSavings / summary.totalIncome) * 100))
      : 0;

  return (
    <section className="space-y-4">
      {/* Section Header with "VIEW ALL" button matching Dakingo layout */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8d1827] dark:text-rose-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Katalog Metrik</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Ringkasan Keuangan Utama
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Status likuiditas dompet, batas anggaran, dan progres target tabungan Anda
          </p>
        </div>

        <button
          onClick={() => onNavigate('reports')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#7b1824] hover:bg-[#60111b] active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Cards Grid (Inspired by Bestsellers Cards in Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Total Saldo */}
        <div
          onClick={() => onNavigate('wallets')}
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-rose-100/80 dark:border-zinc-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {/* Top Visual Frame */}
          <div className="relative w-full h-32 rounded-xl bg-gradient-to-br from-rose-50 via-amber-50/50 to-rose-100/60 dark:from-zinc-800 dark:via-zinc-800/80 dark:to-zinc-900 flex items-center justify-center p-4 border border-rose-100/60 dark:border-zinc-700/50">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7b1824] to-[#a82233] text-white flex items-center justify-center shadow-lg shadow-[#7b1824]/30 group-hover:scale-110 transition-transform">
              <Wallet className="w-8 h-8" />
            </div>
            {/* Heart/Status Badge in corner */}
            <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs text-rose-600 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Content */}
          <div className="mt-3.5 flex-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{accountsCount} Dompet Aktif</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
              Total Saldo Likuid
            </h3>
            <p className="text-lg sm:text-xl font-black text-[#7b1824] dark:text-rose-400 mt-0.5">
              {formatCurrency(summary.totalBalance)}
            </p>

            {/* Stars Rating / Health Indicator */}
            <div className="flex items-center gap-1 mt-2 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-[10px] text-zinc-400 ml-1 font-medium">Saldo Aman</span>
            </div>
          </div>

          {/* Bottom Action Pill */}
          <div className="mt-4 pt-3 border-t border-rose-50 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Kelola Rekening
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-zinc-800 group-hover:bg-[#7b1824] group-hover:text-white text-[#7b1824] dark:text-rose-300 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 2: Pengeluaran Bulan Ini */}
        <div
          onClick={() => onNavigate('budgets')}
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-rose-100/80 dark:border-zinc-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {/* Top Visual Frame */}
          <div className="relative w-full h-32 rounded-xl bg-gradient-to-br from-rose-50 via-rose-100/40 to-amber-50 dark:from-zinc-800 dark:via-zinc-800/80 dark:to-zinc-900 flex items-center justify-center p-4 border border-rose-100/60 dark:border-zinc-700/50">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-[#8d1827] text-white flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-8 h-8" />
            </div>
            {/* Status Pill in corner */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-xs">
              {budgetUsagePercent > 0 ? `${budgetUsagePercent}% Budget` : 'Terkontrol'}
            </div>
          </div>

          {/* Content */}
          <div className="mt-3.5 flex-1">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
              {totalBudgetLimit > 0 ? `Limit: ${formatCurrency(totalBudgetLimit)}` : 'Arus Keluar'}
            </span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
              Pengeluaran Bulan Ini
            </h3>
            <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {formatCurrency(summary.totalExpense)}
            </p>

            {/* Mini Progress Bar */}
            <div className="mt-2.5 space-y-1">
              <div className="w-full h-2 rounded-full bg-rose-100/60 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetUsagePercent > 90
                      ? 'bg-red-500'
                      : budgetUsagePercent > 70
                      ? 'bg-amber-500'
                      : 'bg-[#7b1824]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, budgetUsagePercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Pill */}
          <div className="mt-4 pt-3 border-t border-rose-50 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Evaluasi Anggaran
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-zinc-800 group-hover:bg-[#7b1824] group-hover:text-white text-[#7b1824] dark:text-rose-300 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 3: Target Tabungan (Goal Progress) */}
        <div
          onClick={() => onNavigate('goals')}
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-rose-100/80 dark:border-zinc-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {/* Top Visual Frame */}
          <div className="relative w-full h-32 rounded-xl bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 dark:from-zinc-800 dark:via-zinc-800/80 dark:to-zinc-900 flex items-center justify-center p-4 border border-rose-100/60 dark:border-zinc-700/50">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <Target className="w-8 h-8" />
            </div>
            {/* Status Pill */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
              {goalProgress}% Capai
            </div>
          </div>

          {/* Content */}
          <div className="mt-3.5 flex-1">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {primaryGoal ? 'Target Tabungan Aktif' : 'Buat Target Baru'}
            </span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
              {primaryGoal?.name || 'Impian Finansial'}
            </h3>
            <p className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formatCurrency(primaryGoal?.currentAmount || 0)}
            </p>

            {/* Progress Bar */}
            <div className="mt-2.5 space-y-1">
              <div className="w-full h-2 rounded-full bg-amber-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.max(5, goalProgress)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Target: {formatCurrency(primaryGoal?.targetAmount || 0)}
              </p>
            </div>
          </div>

          {/* Bottom Action Pill */}
          <div className="mt-4 pt-3 border-t border-rose-50 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Setor Tabungan
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-zinc-800 group-hover:bg-[#7b1824] group-hover:text-white text-[#7b1824] dark:text-rose-300 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 4: Sisa Kas & Rasio Hemat */}
        <div
          onClick={() => onNavigate('reports')}
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-rose-100/80 dark:border-zinc-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {/* Top Visual Frame */}
          <div className="relative w-full h-32 rounded-xl bg-gradient-to-br from-emerald-50 via-rose-50 to-teal-50 dark:from-zinc-800 dark:via-zinc-800/80 dark:to-zinc-900 flex items-center justify-center p-4 border border-rose-100/60 dark:border-zinc-700/50">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-[#7b1824] text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <PiggyBank className="w-8 h-8" />
            </div>
            {/* Status Pill */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
              {savingsRate}% Rasio
            </div>
          </div>

          {/* Content */}
          <div className="mt-3.5 flex-1">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Arus Kas Bersih (Net)
            </span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
              Akumulasi Simpanan
            </h3>
            <p
              className={`text-lg sm:text-xl font-black mt-0.5 ${
                summary.netSavings >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-600'
              }`}
            >
              {formatCurrency(summary.netSavings)}
            </p>

            {/* Stars Rating */}
            <div className="flex items-center gap-1 mt-2 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < (savingsRate > 20 ? 5 : savingsRate > 10 ? 4 : 3)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-300 dark:text-zinc-700'
                  }`}
                />
              ))}
              <span className="text-[10px] text-zinc-400 ml-1 font-medium">Disiplin Sehat</span>
            </div>
          </div>

          {/* Bottom Action Pill */}
          <div className="mt-4 pt-3 border-t border-rose-50 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Analisis Cashflow
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-zinc-800 group-hover:bg-[#7b1824] group-hover:text-white text-[#7b1824] dark:text-rose-300 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
