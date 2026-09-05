import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { RecurringTransaction, TransactionType, FrequencyType } from '@/types';
import { getTodayDateString } from '@/lib/utils';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecurring?: RecurringTransaction | null;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  initialRecurring,
}) => {
  const { accounts, categories, addRecurring, updateRecurring } = useBudgetStore();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [nextDueDate, setNextDueDate] = useState(getTodayDateString());
  const [autoCreate, setAutoCreate] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  useEffect(() => {
    if (initialRecurring) {
      setTitle(initialRecurring.title);
      setType(initialRecurring.type);
      setAmount(initialRecurring.amount);
      setAccountId(initialRecurring.accountId);
      setToAccountId(initialRecurring.toAccountId || accounts.find(a => a.id !== initialRecurring.accountId)?.id || '');
      setCategoryId(initialRecurring.categoryId);
      setFrequency(initialRecurring.frequency);
      setDayOfMonth(initialRecurring.dayOfMonth || 1);
      setNextDueDate(initialRecurring.nextDueDate);
      setAutoCreate(initialRecurring.autoCreate);
      setNotes(initialRecurring.notes || '');
    } else {
      setTitle('');
      setType('expense');
      setAmount(150000);
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      setCategoryId(filteredCategories[0]?.id || '');
      setFrequency('monthly');
      setDayOfMonth(1);
      setNextDueDate(getTodayDateString());
      setAutoCreate(true);
      setNotes('');
    }
    setError('');
  }, [initialRecurring, isOpen, accounts, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama langganan / tagihan harus diisi.');
      return;
    }
    if (amount <= 0) {
      setError('Nominal harus lebih dari Rp 0.');
      return;
    }
    if (!accountId) {
      setError('Pilih akun pembayar.');
      return;
    }
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setError('Pilih akun tujuan transfer yang berbeda dengan akun sumber.');
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      setError('Pilih kategori.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialRecurring) {
        // Perbarui data tanpa mereset status isActive
        await updateRecurring(initialRecurring.id, {
          title,
          type,
          amount,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          categoryId: type === 'transfer' ? 'cat_transfer' : categoryId,
          frequency,
          dayOfMonth,
          nextDueDate,
          autoCreate,
          notes,
        });
      } else {
        await addRecurring({
          title,
          type,
          amount,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          categoryId: type === 'transfer' ? 'cat_transfer' : categoryId,
          frequency,
          dayOfMonth,
          nextDueDate,
          autoCreate,
          notes,
          isActive: true,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi rutin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRecurring ? 'Edit Tagihan / Transaksi Rutin' : 'Tambah Tagihan / Transaksi Rutin'}
      description="Otomatiskan pencatatan langganan, sewa, listrik, dan pengeluaran berulang"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Transaksi / Tagihan"
          placeholder="Contoh: Netflix, Wi-Fi Indihome, BPJS, Kosan"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Jenis
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="expense">Pengeluaran Rutin</option>
              <option value="income">Pemasukan Rutin (Gaji/Sewa)</option>
              <option value="transfer">Pindah Saldo Rutin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Frekuensi
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FrequencyType)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="monthly">Bulanan</option>
              <option value="weekly">Mingguan</option>
              <option value="yearly">Tahunan</option>
              <option value="daily">Harian</option>
            </select>
          </div>
        </div>

        <CurrencyInput
          label="Nominal (Rp)"
          value={amount}
          onChange={setAmount}
        />

        <div className={`grid ${type === 'transfer' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'} gap-3`}>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {type === 'transfer' ? 'Dari Akun Sumber' : 'Akun Pembayaran'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {type === 'transfer' ? (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Ke Akun Tujuan
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="" disabled>Pilih Akun Tujuan</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Input
          type="date"
          label="Jatuh Tempo Berikutnya"
          value={nextDueDate}
          onChange={(e) => setNextDueDate(e.target.value)}
        />

        <Input
          label="Catatan (Opsional)"
          placeholder="Contoh: No pelanggan 123456"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-1/3"
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-2/3"
            isLoading={isSubmitting}
          >
            {initialRecurring ? 'Simpan Perubahan' : 'Simpan Transaksi Rutin'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
