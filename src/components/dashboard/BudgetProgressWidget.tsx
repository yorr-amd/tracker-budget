import React from 'react';
import { Card, CardTitle } from '../ui/Card';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency, getCurrentPeriod } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { ActiveTab } from '@/types';
import { PieChart, AlertCircle, ArrowRight } from 'lucide-react';

interface BudgetProgressWidgetProps {
  onOpenBudgetModal: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const BudgetProgressWidget: React.FC<BudgetProgressWidgetProps> = ({
  onOpenBudgetModal,
  onNavigate,
}) => {
  const { budgets, categories, getCategorySpending } = useBudgetStore();

  const currentPeriod = getCurrentPeriod();
  const currentBudgets = budgets.filter((b) => b.period === currentPeriod);

  const budgetsWithSpending = currentBudgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const spent = getCategorySpending(b.categoryId, currentPeriod);
    const percent = b.amountLimit > 0 ? (spent / b.amountLimit) * 100 : 0;
    return {
      ...b,
      categoryName: cat?.name || 'Kategori',
      icon: cat?.icon || 'Tag',
      color: cat?.color || '#3B82F6',
      spent,
      percent,
      isOver: spent > b.amountLimit,
      isWarning: percent >= 80 && percent <= 100,
    };
  });

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600" />
          <span>Pantauan Anggaran Bulan Ini</span>
        </CardTitle>
        <button
          onClick={() => onNavigate('budgets')}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-0.5 font-medium cursor-pointer"
        >
          <span>Atur Anggaran</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {budgetsWithSpending.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
          <p className="text-xs">Belum ada anggaran bulanan yang ditentukan</p>
          <button
            onClick={onOpenBudgetModal}
            className="mt-2 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
          >
            + Buat Anggaran Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3.5 overflow-y-auto max-h-72 pr-1">
          {budgetsWithSpending.slice(0, 5).map((b) => {
            const barColor = b.isOver
              ? 'bg-rose-500'
              : b.isWarning
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px]"
                      style={{ backgroundColor: b.color }}
                    >
                      <DynamicIcon name={b.icon} className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {b.categoryName}
                    </span>
                    {b.isOver && (
                      <span className="flex items-center gap-0.5 text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded font-semibold">
                        <AlertCircle className="w-3 h-3" /> Overbudget
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    <strong className="text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(b.spent)}
                    </strong>{' '}
                    / {formatCurrency(b.amountLimit)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, b.percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
