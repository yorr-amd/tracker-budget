import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { formatCurrency, formatDate, getTodayDateString, calculateNextDueDate } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { RecurringTransaction } from '@/types';
import {
  Repeat,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Zap,
} from 'lucide-react';
import { RecurringModal } from '@/components/forms/RecurringModal';

export const RecurringView: React.FC = () => {
  const {
    recurringTransactions,
    accounts,
    categories,
    createTransaction,
    updateRecurring,
    toggleRecurringActive,
    deleteRecurring,
  } = useBudgetStore();
  const { toast } = useToast();

  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Confirm state
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [confirmPay, setConfirmPay] = useState<RecurringTransaction | null>(null);

  const accountsMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

  const totalMonthlyRecurring = recurringTransactions
    .filter((r) => r.isActive && r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const handlePayNow = async (rec: RecurringTransaction) => {
    setPayingId(rec.id);
    try {
      await createTransaction({
        accountId: rec.accountId,
        toAccountId: rec.toAccountId,
        categoryId: rec.categoryId,
        type: rec.type,
        amount: rec.amount,
        date: getTodayDateString(),
        notes: `Tagihan Rutin: ${rec.title}`,
        isRecurring: true,
      });

      // Majukan tanggal jatuh tempo berikutnya sesuai frekuensi
      const nextDue = calculateNextDueDate(rec.nextDueDate, rec.frequency, rec.dayOfMonth);
      await updateRecurring(rec.id, { nextDueDate: nextDue });

      toast.success(
        `Pembayaran ${rec.title} (${formatCurrency(rec.amount)}) berhasil dicatat! Jatuh tempo berikutnya: ${formatDate(nextDue)}.`,
        'Pembayaran Berhasil'
      );
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencatat pembayaran', 'Gagal Membayar');
    } finally {
      setPayingId(null);
      setConfirmPay(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteRecurring(confirmDelete.id);
      toast.success(`Tagihan rutin "${confirmDelete.title}" berhasil dihapus.`, 'Berhasil Dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus tagihan', 'Gagal');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-600" />
            <span>Tagihan & Transaksi Rutin</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pantau langganan bulanan, sewa, asuransi, dan cicilan agar tidak terlambat bayar
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Tagihan Rutin
        </Button>
      </div>

      {/* Overview Banner */}
      <Card className="bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900 text-white border-0 shadow-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Komitmen Pengeluaran Rutin
            </span>
            <p className="text-3xl font-black mt-1">
              {formatCurrency(totalMonthlyRecurring)} / bulan
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {recurringTransactions.filter((r) => r.isActive).length} tagihan & langganan aktif
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl text-xs">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Dapat dicatat otomatis atau satu klik bayar</span>
          </div>
        </div>
      </Card>

      {/* Recurring List */}
      {recurringTransactions.length === 0 ? (
        <Card className="py-16 text-center text-zinc-400">
          <Repeat className="w-12 h-12 stroke-[1.2] mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">Belum ada transaksi berulang yang didaftarkan</p>
          <p className="text-xs text-zinc-500 mt-1">
            Contoh: Netflix, Spotify, Wi-Fi Indihome, BPJS, Kosan, Gaji
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Tambah Langganan Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringTransactions.map((rec) => {
            const cat = categoriesMap.get(rec.categoryId);
            const accName = accountsMap.get(rec.accountId) || 'Akun';
            const isIncome = rec.type === 'income';

            return (
              <Card
                key={rec.id}
                className={`p-5 flex flex-col justify-between transition-all ${
                  !rec.isActive ? 'opacity-60 bg-zinc-50 dark:bg-zinc-900/40' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: cat?.color || '#6B7280' }}
                      >
                        <DynamicIcon name={cat?.icon || 'Repeat'} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {rec.title}
                          </h4>
                          <Badge variant={isIncome ? 'success' : 'neutral'} size="sm">
                            {rec.frequency === 'monthly'
                              ? 'Bulanan'
                              : rec.frequency === 'weekly'
                              ? 'Mingguan'
                              : rec.frequency === 'yearly'
                              ? 'Tahunan'
                              : 'Harian'}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {cat?.name} • Bayar via {accName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingRecurring(rec)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        aria-label="Edit Tagihan Rutin"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: rec.id, title: rec.title })}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        aria-label="Hapus Tagihan Rutin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-zinc-500 block">Nominal Rutin</span>
                      <span
                        className={`text-base font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(rec.amount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block">Jatuh Tempo</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {formatDate(rec.nextDueDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rec.isActive}
                      onChange={(e) => toggleRecurringActive(rec.id, e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Aktif</span>
                  </label>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setConfirmPay(rec)}
                    isLoading={payingId === rec.id}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Catat Bayar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Add Modal */}
      <RecurringModal
        isOpen={isAddModalOpen || !!editingRecurring}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecurring(null);
        }}
        initialRecurring={editingRecurring}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Transaksi Rutin?"
        message={`Apakah Anda yakin ingin menghapus jadwal transaksi rutin "${confirmDelete?.title}"?`}
        confirmText="Hapus"
        variant="danger"
      />

      {/* Confirm Pay Modal */}
      {confirmPay && (
        <ConfirmModal
          isOpen={!!confirmPay}
          onClose={() => setConfirmPay(null)}
          onConfirm={() => handlePayNow(confirmPay)}
          title="Catat Pembayaran Sekarang?"
          message={`Akan dicatat pengeluaran untuk "${confirmPay.title}" sebesar ${formatCurrency(confirmPay.amount)} dari dompet terkait.`}
          confirmText="Bayar Sekarang"
          variant="primary"
        />
      )}
    </div>
  );
};
