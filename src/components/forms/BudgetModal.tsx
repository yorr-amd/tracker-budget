import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CurrencyInput } from '../ui/CurrencyInput';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../ui/Toast';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Budget } from '@/types';
import { getCurrentPeriod } from '@/lib/utils';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBudget?: Budget | null;
  period?: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  initialBudget,
  period = getCurrentPeriod(),
}) => {
  const { categories, setBudget, deleteBudget } = useBudgetStore();
  const { toast } = useToast();

  const [categoryId, setCategoryId] = useState('');
  const [amountLimit, setAmountLimit] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (initialBudget) {
      setCategoryId(initialBudget.categoryId);
      setAmountLimit(initialBudget.amountLimit);
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setAmountLimit(1000000);
    }
    setError('');
  }, [initialBudget, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Pilih kategori pengeluaran.');
      return;
    }
    if (amountLimit <= 0) {
      setError('Batas anggaran harus lebih dari Rp 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setBudget(categoryId, amountLimit, period);
      toast.success('Batas anggaran berhasil diperbarui!', 'Anggaran Disimpan');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialBudget) return;
    setIsSubmitting(true);
    try {
      await deleteBudget(initialBudget.id);
      toast.success('Batas anggaran untuk kategori ini berhasil dihapus.', 'Anggaran Dihapus');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus');
    } finally {
      setIsSubmitting(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialBudget ? 'Ubah Batas Anggaran' : 'Atur Batas Anggaran Baru'}
        description={`Tentukan batas maksimal pengeluaran bulanan (Periode: ${period})`}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Pilih Kategori Pengeluaran
            </label>
            <select
              value={categoryId}
              disabled={!!initialBudget}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <CurrencyInput
            label="Batas Anggaran Bulanan (Rp)"
            value={amountLimit}
            onChange={setAmountLimit}
            placeholder="0"
            autoFocus
          />

          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {initialBudget && (
              <Button
                type="button"
                variant="danger"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="w-1/3"
                disabled={isSubmitting}
              >
                Hapus
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className={initialBudget ? 'w-1/3' : 'w-1/2'}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={initialBudget ? 'w-1/3' : 'w-1/2'}
              isLoading={isSubmitting}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Anggaran Kategori?"
        message="Apakah Anda yakin ingin menghapus batas anggaran bulanan untuk kategori ini?"
        confirmText="Hapus Anggaran"
        variant="danger"
      />
    </>
  );
};
