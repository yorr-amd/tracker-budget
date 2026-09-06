import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Installment, InstallmentType } from '@/types';
import { getTodayDateString } from '@/lib/utils';
import { Calendar, CreditCard, Landmark } from 'lucide-react';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InstallmentType;
  initialInstallment?: Installment | null;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  onClose,
  type,
  initialInstallment,
}) => {
  const { accounts, addInstallment, updateInstallment } = useBudgetStore();

  const isSpaylater = type === 'spaylater';

  const [title, setTitle] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [totalTenorMonths, setTotalTenorMonths] = useState<number>(3);
  const [currentInstallment, setCurrentInstallment] = useState<number>(1);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(5);
  const [nextDueDate, setNextDueDate] = useState(getTodayDateString());
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialInstallment) {
      setTitle(initialInstallment.title);
      setMonthlyAmount(initialInstallment.monthlyAmount);
      setTotalTenorMonths(initialInstallment.totalTenorMonths);
      setCurrentInstallment(initialInstallment.currentInstallment);
      setTotalAmount(initialInstallment.totalAmount || initialInstallment.monthlyAmount * initialInstallment.totalTenorMonths);
      setDueDayOfMonth(initialInstallment.dueDayOfMonth);
      setNextDueDate(initialInstallment.nextDueDate);
      setAccountId(initialInstallment.accountId);
      setNotes(initialInstallment.notes || '');
    } else {
      setTitle('');
      setMonthlyAmount(100000);
      setTotalTenorMonths(3);
      setCurrentInstallment(1);
      setTotalAmount(300000);
      setDueDayOfMonth(5);
      setNextDueDate(getTodayDateString());

      if (isSpaylater) {
        const preferred = accounts.find((a) => a.id === 'acc_ewallet_shopeepay') || accounts.find((a) => a.id === 'acc_bank_seabank') || accounts[0];
        setAccountId(preferred?.id || '');
      } else {
        const preferred = accounts.find((a) => a.id === 'acc_bank_seabank') || accounts.find((a) => a.id === 'acc_bank_bsi') || accounts[0];
        setAccountId(preferred?.id || '');
      }

      setNotes('');
    }
    setError('');
  }, [initialInstallment, isOpen, type, accounts]);

  const handleMonthlyAmountChange = (val: number) => {
    setMonthlyAmount(val);
    setTotalAmount(val * totalTenorMonths);
  };

  const handleTenorChange = (tenor: number) => {
    setTotalTenorMonths(tenor);
    setTotalAmount(monthlyAmount * tenor);
    if (currentInstallment > tenor) {
      setCurrentInstallment(tenor);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isSpaylater ? 'Nama barang / belanja cicilan harus diisi.' : 'Keperluan pinjaman SPinjam harus diisi.');
      return;
    }
    if (monthlyAmount <= 0) {
      setError('Nominal cicilan per bulan harus lebih dari Rp 0.');
      return;
    }
    if (totalTenorMonths < 1) {
      setError('Tenor cicilan minimal 1 bulan.');
      return;
    }
    if (currentInstallment < 1 || currentInstallment > totalTenorMonths) {
      setError(`Cicilan saat ini harus berada di antara 1 dan ${totalTenorMonths}.`);
      return;
    }
    if (dueDayOfMonth < 1 || dueDayOfMonth > 31) {
      setError('Tanggal jatuh tempo harus antara 1 dan 31.');
      return;
    }
    if (!accountId) {
      setError('Pilih akun / dompet untuk pembayaran cicilan.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialInstallment) {
        await updateInstallment(initialInstallment.id, {
          title: title.trim(),
          monthlyAmount,
          totalTenorMonths,
          currentInstallment,
          totalAmount,
          dueDayOfMonth,
          nextDueDate,
          accountId,
          notes: notes.trim() || undefined,
        });
      } else {
        await addInstallment({
          type,
          title: title.trim(),
          monthlyAmount,
          totalTenorMonths,
          currentInstallment,
          totalAmount,
          dueDayOfMonth,
          nextDueDate,
          accountId,
          notes: notes.trim() || undefined,
          isCompleted: false,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan cicilan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const titlePrefix = isSpaylater ? 'SPayLater' : 'SPinjam';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialInstallment ? `Edit Cicilan ${titlePrefix}` : `Tambah Cicilan ${titlePrefix}`}
      description={
        isSpaylater
          ? 'Catat pembelian barang dengan cicilan Shopee PayLater'
          : 'Catat pinjaman dana tunai dan jadwal angsuran Shopee Pinjam'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={isSpaylater ? 'Nama Barang / Belanja' : 'Keperluan / Nama Pinjaman'}
          placeholder={isSpaylater ? 'Contoh: HP Samsung Galaxy, Sepatu Olahraga, Kulkas' : 'Contoh: Modal Usaha, Renovasi Rumah, Biaya Medis'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <CurrencyInput
          label="Cicilan per Bulan (Rp)"
          value={monthlyAmount}
          onChange={handleMonthlyAmountChange}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Tenor (Berapa Bulan)
            </label>
            <div className="flex items-center gap-1 mb-1.5">
              {[1, 3, 6, 12, 18, 24].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTenorChange(t)}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    totalTenorMonths === t
                      ? isSpaylater
                        ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                        : 'border-orange-500 bg-orange-500 text-white shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {t}x
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="60"
              value={totalTenorMonths}
              onChange={(e) => handleTenorChange(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cicilan Berjalan (Ke-)
            </label>
            <p className="text-[11px] text-zinc-400 mb-1.5">Mulai dari cicilan ke:</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={totalTenorMonths}
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-bold"
              />
              <span className="text-xs text-zinc-500 whitespace-nowrap">dari {totalTenorMonths}</span>
            </div>
          </div>
        </div>

        <CurrencyInput
          label={isSpaylater ? 'Estimasi Total Nilai Belanja (Rp)' : 'Total Pokok Pinjaman (Rp)'}
          value={totalAmount}
          onChange={setTotalAmount}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Jatuh Tempo (Tiap Tgl)
            </label>
            <div className="flex items-center gap-1 mb-1.5">
              {[5, 11, 25].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDueDayOfMonth(d)}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    dueDayOfMonth === d
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  Tgl {d}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="31"
              value={dueDayOfMonth}
              onChange={(e) => setDueDayOfMonth(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tgl Tagihan Terdekat</span>
            </label>
            <p className="text-[11px] text-zinc-400 mb-1.5">Bulan ini / selanjutnya</p>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            {isSpaylater ? <CreditCard className="w-3.5 h-3.5 text-rose-500" /> : <Landmark className="w-3.5 h-3.5 text-orange-500" />}
            <span>Sumber Dana Pembayaran (Rekening / E-Wallet)</span>
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Beli saat promo payday, no transaksi SP-102938"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
          />
        </div>

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
            {initialInstallment ? 'Simpan Perubahan' : 'Tambah Cicilan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
