import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '@/lib/utils';
import { Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import { FinancialSummary } from '@/types';

interface StatCardsProps {
  summary: FinancialSummary;
}

export const StatCards: React.FC<StatCardsProps> = ({ summary }) => {
  const isNetPositive = summary.netSavings >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Saldo */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-lg shadow-emerald-700/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
            Total Saldo Bersih
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black tracking-tight">
            {formatCurrency(summary.totalBalance)}
          </p>
          <p className="text-[11px] text-emerald-100/90 mt-1 flex items-center gap-1">
            <span>Semua Akun & Dompet Aktif</span>
          </p>
        </div>
      </Card>

      {/* Pemasukan Bulan Ini */}
      <Card className="hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Pemasukan Bulan Ini
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {formatCurrency(summary.totalIncome)}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Arus kas masuk</span>
          </p>
        </div>
      </Card>

      {/* Pengeluaran Bulan Ini */}
      <Card className="hover:border-rose-200 dark:hover:border-rose-800/60 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Pengeluaran Bulan Ini
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {formatCurrency(summary.totalExpense)}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Arus kas keluar</span>
          </p>
        </div>
      </Card>

      {/* Sisa Kas */}
      <Card className="hover:border-blue-200 dark:hover:border-blue-800/60 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Sisa Bersih (Tabungan)
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className={`text-2xl font-bold tracking-tight ${isNetPositive ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(summary.netSavings)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {summary.totalIncome > 0
              ? `Tingkat Tabungan: ${Math.max(0, Math.round((summary.netSavings / summary.totalIncome) * 100))}%`
              : 'Belum ada pemasukan'}
          </p>
        </div>
      </Card>
    </div>
  );
};
