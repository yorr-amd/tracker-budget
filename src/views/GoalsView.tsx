import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { SavingsGoal } from '@/types';
import {
  Target,
  Plus,
  CheckCircle,
  Calendar,
  Edit2,
  Trash2,
  History,
  ArrowUpRight,
} from 'lucide-react';
import { SavingsGoalModal, SavingsDepositModal, SavingsWithdrawModal } from '@/components/forms/SavingsGoalModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

export const GoalsView: React.FC = () => {
  const { savingsGoals, savingsLogs, accounts, deleteSavingsGoal } = useBudgetStore();
  const { toast } = useToast();

  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingsGoal | null>(null);
  const [selectedGoalForWithdraw, setSelectedGoalForWithdraw] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<{ id: string; name: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewLogGoalId, setViewLogGoalId] = useState<string | null>(null);

  const totalTargetAmount = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavedAmount = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  const accountsMap = new Map(accounts.map((a) => [a.id, a.name]));

  const handleConfirmDelete = async () => {
    if (!confirmDeleteGoal) return;
    try {
      await deleteSavingsGoal(confirmDeleteGoal.id);
      toast.success(`Target tabungan "${confirmDeleteGoal.name}" berhasil dihapus.`, 'Target Dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus target tabungan', 'Terjadi Kesalahan');
    } finally {
      setConfirmDeleteGoal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span>Target Tabungan & Celengan</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Wujudkan impian finansial, dana darurat, dan wishlist impian Anda
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Buat Target Baru
        </Button>
      </div>

      {/* Overview Stats */}
      <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white border-0 shadow-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-xs text-emerald-100 font-semibold uppercase tracking-wider">
              Total Tabungan Terkumpul
            </p>
            <p className="text-3xl font-black mt-1">
              {formatCurrency(totalSavedAmount)}
            </p>
            <p className="text-xs text-emerald-100/80 mt-1">
              Dari total target {formatCurrency(totalTargetAmount)} ({savingsGoals.length} Impian)
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
            <div>
              <span className="text-[11px] text-emerald-100 block">Tercapai</span>
              <span className="text-base font-bold text-emerald-300">
                {savingsGoals.filter((g) => g.currentAmount >= g.targetAmount).length} Target
              </span>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="text-[11px] text-emerald-100 block">Progres Rata-rata</span>
              <span className="text-base font-bold text-white">
                {totalTargetAmount > 0 ? Math.round((totalSavedAmount / totalTargetAmount) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savingsGoals.map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const isCompleted = progress >= 100 || goal.isCompleted;

          return (
            <Card
              key={goal.id}
              className={`p-6 flex flex-col justify-between relative transition-all ${
                isCompleted
                  ? 'border-teal-300 dark:border-teal-900/60 bg-teal-50/20 dark:bg-teal-950/10'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: goal.color }}
                    >
                      <DynamicIcon name={goal.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                        {goal.name}
                      </h3>
                      {goal.notes && (
                        <p className="text-xs text-zinc-500 italic mt-0.5">
                          "{goal.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Edit Target"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteGoal({ id: goal.id, name: goal.name })}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Hapus Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Amounts & Due Date */}
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Terkumpul</span>
                    <strong className="text-sm text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {formatCurrency(goal.currentAmount)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Target Nominal</span>
                    <strong className="text-sm text-zinc-800 dark:text-zinc-200 block mt-0.5">
                      {formatCurrency(goal.targetAmount)}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                    <span>Progres Tercapai</span>
                    <span>{Math.min(100, Math.round(progress))}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-teal-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                {goal.targetDate && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target selesai: {formatDate(goal.targetDate)}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => setViewLogGoalId(viewLogGoalId === goal.id ? null : goal.id)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{viewLogGoalId === goal.id ? 'Tutup Riwayat' : 'Riwayat Setoran'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {goal.currentAmount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGoalForWithdraw(goal)}
                      title="Cairkan saldo tabungan ke dompet/rekening"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Cairkan
                    </Button>
                  )}

                  {isCompleted ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1.5 rounded-xl">
                      <CheckCircle className="w-4 h-4" /> Target Tercapai! 🎉
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedGoalForDeposit(goal)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Setor Tabungan
                    </Button>
                  )}
                </div>
              </div>

              {/* History Logs */}
              {viewLogGoalId === goal.id && (
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
                  <h5 className="font-semibold text-zinc-700 dark:text-zinc-300">Riwayat Mutasi Tabungan:</h5>
                  {savingsLogs.filter((l) => l.goalId === goal.id).length === 0 ? (
                    <p className="text-zinc-400">Belum ada mutasi tercatat</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {savingsLogs
                        .filter((l) => l.goalId === goal.id)
                        .map((log) => (
                          <div
                            key={log.id}
                            className="flex justify-between items-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                          >
                            <div>
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {accountsMap.get(log.accountId) || 'Akun'}
                              </span>
                              <span className="text-[10px] text-zinc-400 block">{formatDate(log.date)} • {log.notes || 'Mutasi'}</span>
                            </div>
                            <span className={`font-bold ${log.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modals */}
      <SavingsGoalModal
        isOpen={isAddModalOpen || !!editingGoal}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingGoal(null);
        }}
        initialGoal={editingGoal}
      />

      <SavingsDepositModal
        isOpen={!!selectedGoalForDeposit}
        onClose={() => setSelectedGoalForDeposit(null)}
        goal={selectedGoalForDeposit}
      />

      <SavingsWithdrawModal
        isOpen={!!selectedGoalForWithdraw}
        onClose={() => setSelectedGoalForWithdraw(null)}
        goal={selectedGoalForWithdraw}
      />

      {/* Confirm Delete Goal Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteGoal}
        onClose={() => setConfirmDeleteGoal(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Target Tabungan?"
        message={`Apakah Anda yakin ingin menghapus target tabungan "${confirmDeleteGoal?.name}"? Seluruh riwayat setoran untuk target ini juga akan dihapus.`}
        confirmText="Hapus Target"
        variant="danger"
      />
    </div>
  );
};
