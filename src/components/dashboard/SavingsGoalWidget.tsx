import React, { useState } from 'react';
import { Card, CardTitle } from '../ui/Card';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { SavingsGoal, ActiveTab } from '@/types';
import { Target, Plus, CheckCircle, ArrowRight } from 'lucide-react';
import { SavingsDepositModal } from '../forms/SavingsGoalModal';

interface SavingsGoalWidgetProps {
  onOpenGoalModal: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SavingsGoalWidget: React.FC<SavingsGoalWidgetProps> = ({
  onOpenGoalModal,
  onNavigate,
}) => {
  const { savingsGoals } = useBudgetStore();
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingsGoal | null>(null);

  return (
    <>
      <Card className="h-full flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Target Tabungan & Celengan</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGoalModal}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-0.5 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Target Baru</span>
            </button>
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-0.5 ml-2 cursor-pointer"
            >
              <span>Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
            <p className="text-xs">Belum ada target tabungan</p>
            <button
              onClick={onOpenGoalModal}
              className="mt-2 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
            >
              + Rencanakan Target Pertamamu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savingsGoals.slice(0, 4).map((goal) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const isFinished = progress >= 100 || goal.isCompleted;

              return (
                <div
                  key={goal.id}
                  className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: goal.color }}
                      >
                        <DynamicIcon name={goal.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                          {goal.name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                    </div>
                    {isFinished ? (
                      <span className="flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md font-semibold">
                        <CheckCircle className="w-3 h-3" /> Tercapai
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedGoalForDeposit(goal)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-semibold rounded-lg shadow-xs transition-transform cursor-pointer"
                      >
                        + Setor
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-zinc-500 font-medium mb-1">
                      <span>Progres</span>
                      <span>{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <SavingsDepositModal
        isOpen={!!selectedGoalForDeposit}
        onClose={() => setSelectedGoalForDeposit(null)}
        goal={selectedGoalForDeposit}
      />
    </>
  );
};
