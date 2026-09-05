import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { formatCurrency, getCurrentPeriod } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Budget } from '@/types';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { BudgetModal } from '@/components/forms/BudgetModal';

export const BudgetsView: React.FC = () => {
  const { budgets, categories, getCategorySpending, calculateSummary } = useBudgetStore();

  const [period, setPeriod] = useState(getCurrentPeriod());
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter anggaran hanya untuk periode yang sedang dipilih
  const periodBudgets = useMemo(() => {
    return budgets.filter((b) => b.period === period);
  }, [budgets, period]);

  const summary = calculateSummary(period);
  const totalBudgetLimit = periodBudgets.reduce((sum, b) => sum + b.amountLimit, 0);
  const totalSpentInBudgets = periodBudgets.reduce(
    (sum, b) => sum + getCategorySpending(b.categoryId, period),
    0
  );

  const overallPercent = totalBudgetLimit > 0 ? (totalSpentInBudgets / totalBudgetLimit) * 100 : 0;

  // 50/30/20 Rule Calculations based on Income
  const needs50 = summary.totalIncome * 0.5;
  const wants30 = summary.totalIncome * 0.3;
  const savings20 = summary.totalIncome * 0.2;

  const budgetsWithSpending = periodBudgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const spent = getCategorySpending(b.categoryId, period);
    const percent = b.amountLimit > 0 ? (spent / b.amountLimit) * 100 : 0;
    const remaining = b.amountLimit - spent;

    return {
      ...b,
      categoryName: cat?.name || 'Kategori',
      icon: cat?.icon || 'Tag',
      color: cat?.color || '#3B82F6',
      spent,
      percent,
      remaining,
      isOver: spent > b.amountLimit,
      isWarning: percent >= 80 && percent <= 100,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <span>Alokasi & Manajemen Anggaran</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Kendalikan pengeluaran bulanan agar tidak overbudget
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Atur Anggaran Kategori
          </Button>
        </div>
      </div>

      {/* Overall Budget Status Card */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-0 shadow-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Anggaran Periode {period}
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black">
                {formatCurrency(totalSpentInBudgets)}
              </span>
              <span className="text-sm text-zinc-400">
                dari batas {formatCurrency(totalBudgetLimit)}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Sisa kuota anggaran:{' '}
              <strong className={totalBudgetLimit - totalSpentInBudgets >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatCurrency(totalBudgetLimit - totalSpentInBudgets)}
              </strong>
            </p>
          </div>

          {/* Overall Progress Gauge */}
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Penggunaan Anggaran</span>
              <span className={overallPercent > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                {overallPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercent > 100
                    ? 'bg-rose-500'
                    : overallPercent >= 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, overallPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 50/30/20 Smart Financial Allocation Rule */}
      <Card className="border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Rekomendasi Alokasi Keuangan Sehat (Formula 50/30/20)</span>
          </CardTitle>
        </CardHeader>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
          Berdasarkan total pemasukan bulan ini ({formatCurrency(summary.totalIncome)}), berikut pembagian ideal untuk mencapai kebebasan finansial:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>50% Kebutuhan Pokok</span>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">Needs</span>
            </div>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(needs50)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">Makan, listrik, sewa, pulsa, bensin</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              <span>30% Keinginan & Hobi</span>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">Wants</span>
            </div>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(wants30)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">Belanja, nongkrong, bioskop, liburan</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
              <span>20% Tabungan & Investasi</span>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">Savings</span>
            </div>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(savings20)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">Dana darurat, reksadana, tabungan impian</p>
          </div>
        </div>
      </Card>

      {/* Detailed Category Budgets List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Daftar Anggaran Kategori ({budgetsWithSpending.length})
        </h3>

        {budgetsWithSpending.length === 0 ? (
          <Card className="py-16 text-center text-zinc-400">
            <PieChart className="w-12 h-12 stroke-[1.2] mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Belum ada kategori yang dibatasi anggarannya</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => setIsAddModalOpen(true)}
            >
              + Tambah Anggaran Kategori
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetsWithSpending.map((b) => {
              const barColor = b.isOver
                ? 'bg-rose-500'
                : b.isWarning
                ? 'bg-amber-500'
                : 'bg-emerald-500';

              return (
                <Card
                  key={b.id}
                  className={`p-5 relative transition-all ${
                    b.isOver
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: b.color }}
                      >
                        <DynamicIcon name={b.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {b.categoryName}
                        </h4>
                        <p className="text-xs text-zinc-500">
                          Batas: {formatCurrency(b.amountLimit)} / bulan
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingBudget(b)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Edit Anggaran"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Spend Metrics */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-zinc-500 block">Terpakai</span>
                      <strong className="text-sm text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(b.spent)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block">
                        {b.isOver ? 'Kelebihan (Over)' : 'Sisa Kuota'}
                      </span>
                      <strong
                        className={`text-sm ${
                          b.isOver
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(Math.abs(b.remaining))}
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, b.percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-[11px]">
                      <span className="font-semibold text-zinc-500">
                        {b.percent.toFixed(1)}% terpakai
                      </span>
                      {b.isOver ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Melebihi Batas
                        </span>
                      ) : b.isWarning ? (
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Mendekati Limit
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Terkendali
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <BudgetModal
        isOpen={isAddModalOpen || !!editingBudget}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBudget(null);
        }}
        initialBudget={editingBudget}
        period={period}
      />
    </div>
  );
};
