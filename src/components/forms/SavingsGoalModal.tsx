import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DynamicIcon } from '../common/DynamicIcon';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { SavingsGoal } from '@/types';
import { COLOR_OPTIONS } from '@/lib/constants/defaults';
import confetti from 'canvas-confetti';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: SavingsGoal | null;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  initialGoal,
}) => {
  const { addSavingsGoal, updateSavingsGoal } = useBudgetStore();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('PiggyBank');
  const [color, setColor] = useState('#10B981');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialGoal) {
      setName(initialGoal.name);
      setTargetAmount(initialGoal.targetAmount);
      setTargetDate(initialGoal.targetDate || '');
      setIcon(initialGoal.icon);
      setColor(initialGoal.color);
      setNotes(initialGoal.notes || '');
    } else {
      setName('');
      setTargetAmount(10000000);
      setTargetDate('');
      setIcon('PiggyBank');
      setColor('#10B981');
      setNotes('');
    }
    setError('');
  }, [initialGoal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama impian/target tabungan harus diisi.');
      return;
    }
    if (targetAmount <= 0) {
      setError('Target nominal harus lebih dari Rp 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialGoal) {
        await updateSavingsGoal(initialGoal.id, {
          name,
          targetAmount,
          targetDate: targetDate || undefined,
          icon,
          color,
          notes,
        });
      } else {
        await addSavingsGoal({
          name,
          targetAmount,
          targetDate: targetDate || undefined,
          icon,
          color,
          notes,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan target tabungan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialGoal ? 'Edit Target Tabungan' : 'Buat Target Tabungan Baru'}
      description="Rencanakan impian dan tabungan masa depanmu secara terstruktur"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Target / Impian"
          placeholder="Contoh: Beli Laptop Baru, Liburan ke Bali, Dana Darurat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <CurrencyInput
          label="Target Nominal (Rp)"
          value={targetAmount}
          onChange={setTargetAmount}
        />

        <Input
          type="date"
          label="Target Tanggal Tercapai (Opsional)"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />

        <Input
          label="Catatan / Motivasi (Opsional)"
          placeholder="Contoh: Menabung 500rb per bulan"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Warna Tema
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Ikon
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl max-h-24 overflow-y-auto">
              {['PiggyBank', 'Target', 'Laptop', 'Car', 'Home', 'Plane', 'ShieldCheck', 'Gift'].map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    icon === ic
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <DynamicIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
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
            {initialGoal ? 'Simpan Perubahan' : 'Buat Target'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal Setoran Tabungan
interface SavingsDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
}

export const SavingsDepositModal: React.FC<SavingsDepositModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { accounts, depositSavingsGoal } = useBudgetStore();
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
    setAmount(0);
    setNotes('');
    setError('');
  }, [isOpen, accounts]);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError('Pilih akun sumber dana.');
      return;
    }
    if (amount <= 0) {
      setError('Nominal setoran harus lebih dari Rp 0.');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === accountId);
    if (selectedAcc && selectedAcc.balance < amount) {
      setError(`Saldo ${selectedAcc.name} tidak mencukupi.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await depositSavingsGoal(goal.id, accountId, amount, new Date().toISOString().split('T')[0], notes || undefined);
      
      // Jika setelah setoran target tercapai, trigger selebrasi confetti!
      if (goal.currentAmount + amount >= goal.targetAmount) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyetor tabungan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Setor Tabungan: ${goal.name}`}
      description="Pindahkan dana dari akun/dompet Anda ke celengan target ini"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Sumber Dana (Akun)
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})
              </option>
            ))}
          </select>
        </div>

        <CurrencyInput
          label="Jumlah Setoran (Rp)"
          value={amount}
          onChange={setAmount}
          autoFocus
        />

        <Input
          label="Catatan / Keterangan (Opsional)"
          placeholder="Contoh: Sisihan bonus bulanan"
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
            Setor Sekarang
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal Pencairan / Penarikan Tabungan
interface SavingsWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
}

export const SavingsWithdrawModal: React.FC<SavingsWithdrawModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { accounts, withdrawSavingsGoal } = useBudgetStore();
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
    if (goal) {
      setAmount(goal.currentAmount);
    }
    setNotes('');
    setError('');
  }, [isOpen, accounts, goal]);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError('Pilih akun tujuan pencairan.');
      return;
    }
    if (amount <= 0) {
      setError('Nominal pencairan harus lebih dari Rp 0.');
      return;
    }
    if (amount > goal.currentAmount) {
      setError(`Nominal pencairan melebihi saldo celengan (Tersedia: Rp ${goal.currentAmount.toLocaleString('id-ID')}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await withdrawSavingsGoal(goal.id, accountId, amount, new Date().toISOString().split('T')[0], notes || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mencairkan tabungan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cairkan Tabungan: ${goal.name}`}
      description="Pindahkan dana dari celengan target ini kembali ke dompet/rekening Anda"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 block">Saldo Tabungan Tersedia:</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            Rp {goal.currentAmount.toLocaleString('id-ID')}
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Tujuan Pencairan (Akun / Dompet)
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})
              </option>
            ))}
          </select>
        </div>

        <CurrencyInput
          label="Jumlah Pencairan (Rp)"
          value={amount}
          onChange={setAmount}
          autoFocus
        />

        <Input
          label="Catatan / Keterangan (Opsional)"
          placeholder="Contoh: Pencairan sebagian untuk beli tiket"
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
            Cairkan Sekarang
          </Button>
        </div>
      </form>
    </Modal>
  );
};
