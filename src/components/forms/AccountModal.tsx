import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DynamicIcon } from '../common/DynamicIcon';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Account, AccountType } from '@/types';
import { ICON_OPTIONS, COLOR_OPTIONS } from '@/lib/constants/defaults';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccount?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  initialAccount,
}) => {
  const { addAccount, updateAccount } = useBudgetStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState('');
  const [icon, setIcon] = useState('Landmark');
  const [color, setColor] = useState('#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name);
      setType(initialAccount.type);
      setBalance(initialAccount.balance);
      setAccountNumber(initialAccount.accountNumber || '');
      setIcon(initialAccount.icon);
      setColor(initialAccount.color);
    } else {
      setName('');
      setType('bank');
      setBalance(0);
      setAccountNumber('');
      setIcon('Landmark');
      setColor('#3B82F6');
    }
    setError('');
  }, [initialAccount, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama akun/dompet tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialAccount) {
        await updateAccount(initialAccount.id, {
          name,
          type,
          balance,
          accountNumber: accountNumber || undefined,
          icon,
          color,
        });
      } else {
        await addAccount({
          name,
          type,
          balance,
          accountNumber: accountNumber || undefined,
          icon,
          color,
          isDefault: false,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAccount ? 'Edit Akun / Dompet' : 'Tambah Akun / Dompet Baru'}
      description="Kelola sumber dana kas, bank, e-wallet, atau kartu kredit"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipe Akun */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Tipe Akun
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'bank', label: 'Bank', icon: 'Landmark' },
              { id: 'ewallet', label: 'E-Wallet', icon: 'Smartphone' },
              { id: 'cash', label: 'Tunai', icon: 'Wallet' },
              { id: 'credit', label: 'Kartu Kredit', icon: 'CreditCard' },
              { id: 'investment', label: 'Investasi', icon: 'TrendingUp' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setType(t.id as AccountType);
                  setIcon(t.icon);
                }}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  type === t.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <DynamicIcon name={t.icon} className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nama Akun */}
        <Input
          label="Nama Akun / Bank / E-Wallet"
          placeholder="Contoh: BCA Utama, GoPay, Dompet Saku"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Saldo Awal */}
        <CurrencyInput
          label={initialAccount ? 'Saldo Saat Ini (Rp)' : 'Saldo Awal (Rp)'}
          value={balance}
          onChange={setBalance}
        />

        {/* Nomor Rekening */}
        <Input
          label="Nomor Rekening / No. HP (Opsional)"
          placeholder="Contoh: 1234567890 atau 0812xxxx"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
        />

        {/* Warna & Ikon */}
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
              {ICON_OPTIONS.slice(0, 15).map((ic) => (
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
            {initialAccount ? 'Simpan Perubahan' : 'Tambah Akun'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
