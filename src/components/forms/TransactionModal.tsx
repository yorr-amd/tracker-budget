import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DynamicIcon } from '../common/DynamicIcon';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Transaction, TransactionType } from '@/types';
import { getTodayDateString, getCurrentTimeString, formatCurrency } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Calendar, Clock, FileText, Camera } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
}) => {
  const {
    accounts,
    categories,
    createTransaction,
    updateTransaction,
  } = useBudgetStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [adminFee, setAdminFee] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [notes, setNotes] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount);
      setAdminFee(initialTransaction.adminFee || 0);
      setAccountId(initialTransaction.accountId);
      setToAccountId(initialTransaction.toAccountId || '');
      setCategoryId(initialTransaction.categoryId);
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || getCurrentTimeString());
      setNotes(initialTransaction.notes || '');
      setReceiptUrl(initialTransaction.receiptUrl || '');
    } else {
      setType('expense');
      setAmount(0);
      setAdminFee(0);
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      const defaultExpCat = categories.find((c) => c.type === 'expense');
      setCategoryId(defaultExpCat?.id || '');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNotes('');
      setReceiptUrl('');
    }
    setError('');
  }, [initialTransaction, isOpen, accounts, categories]);

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran foto maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Harap masukkan nominal transaksi lebih dari 0.');
      return;
    }
    if (!accountId) {
      setError('Harap pilih akun / dompet sumber.');
      return;
    }
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setError('Harap pilih akun tujuan transfer yang berbeda dengan akun sumber.');
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      setError('Harap pilih kategori transaksi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialTransaction) {
        await updateTransaction(initialTransaction.id, {
          type,
          amount,
          adminFee: type === 'transfer' ? adminFee : 0,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          categoryId: type === 'transfer' ? 'cat_transfer' : categoryId,
          date,
          time,
          notes,
          receiptUrl,
        });
      } else {
        await createTransaction({
          type,
          amount,
          adminFee: type === 'transfer' ? adminFee : 0,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          categoryId: type === 'transfer' ? 'cat_transfer' : categoryId,
          date,
          time,
          notes,
          receiptUrl,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Edit Transaksi' : 'Catat Transaksi'}
      description="Catat pengeluaran, pemasukan, atau transfer antar dompet dengan mudah"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tab Jenis Transaksi */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              const cat = categories.find((c) => c.type === 'expense');
              if (cat) setCategoryId(cat.id);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              const cat = categories.find((c) => c.type === 'income');
              if (cat) setCategoryId(cat.id);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              type === 'transfer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Pindah Saldo
          </button>
        </div>

        {/* Nominal Input */}
        <CurrencyInput
          value={amount}
          onChange={(val) => {
            setAmount(val);
            if (error) setError('');
          }}
          label="Nominal Transaksi (Rp)"
          placeholder="0"
          autoFocus={!initialTransaction}
        />

        {/* Akun Sumber */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {type === 'transfer' ? 'Dari Akun' : 'Pilih Akun / Dompet'}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="" disabled>Pilih Akun</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatCurrency(acc.balance)})
              </option>
            ))}
          </select>
        </div>

        {/* Khusus Transfer */}
        {type === 'transfer' && (
          <>
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
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>
            </div>

            <CurrencyInput
              value={adminFee}
              onChange={setAdminFee}
              label="Biaya Admin Transfer (Opsional)"
              placeholder="0"
            />
          </>
        )}

        {/* Pemilih Kategori */}
        {type !== 'transfer' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Kategori
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center text-xs transition-all border cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                        : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1 text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="truncate w-full text-[11px] leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tanggal & Jam */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Tanggal"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
          <Input
            type="time"
            label="Waktu"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            leftIcon={<Clock className="w-4 h-4" />}
          />
        </div>

        {/* Catatan */}
        <Input
          type="text"
          label="Catatan / Keterangan (Opsional)"
          placeholder="Contoh: Makan siang bareng tim, Bensin motor, dll"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          leftIcon={<FileText className="w-4 h-4" />}
        />

        {/* Foto Struk */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Foto Struk / Bukti (Opsional)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
              <Camera className="w-4 h-4 text-zinc-500" />
              <span>{receiptUrl ? 'Ubah Foto' : 'Unggah Foto'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {receiptUrl && (
              <div className="relative group">
                <img
                  src={receiptUrl}
                  alt="Struk"
                  className="w-10 h-10 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 text-[9px] shadow-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl">
            {error}
          </div>
        )}

        {/* Action Buttons */}
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
            variant={type === 'expense' ? 'danger' : type === 'income' ? 'primary' : 'secondary'}
            className="w-2/3"
            isLoading={isSubmitting}
          >
            {initialTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
