import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Account } from '@/types';
import {
  Wallet,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Receipt,
} from 'lucide-react';
import { AccountModal } from '@/components/forms/AccountModal';
import { TransactionModal } from '@/components/forms/TransactionModal';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

export const WalletsView: React.FC = () => {
  const { accounts, transactions, categories, deleteAccount, calculateSummary } = useBudgetStore();
  const { toast } = useToast();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const summary = calculateSummary();
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const accountTransactions = transactions.filter(
    (t) => t.accountId === activeAccount?.id || t.toAccountId === activeAccount?.id
  );

  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAccount(confirmDelete.id);
      toast.success(`Akun "${confirmDelete.name}" berhasil dihapus.`, 'Akun Dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus akun', 'Terjadi Kesalahan');
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
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>Dompet & Rekening</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Kelola kas tunai, rekening bank, e-wallet, dan investasi Anda
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTransferModalOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Pindah Saldo
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddAccountOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Akun
          </Button>
        </div>
      </div>

      {/* Total Net Worth Card */}
      <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white border-0 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-emerald-100 font-medium uppercase tracking-wider">
              Total Kekayaan Seluruh Akun
            </p>
            <p className="text-3xl font-black mt-1">
              {formatCurrency(summary.totalBalance)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl">
            <div>
              <span className="text-emerald-100 block">Jumlah Akun</span>
              <span className="font-bold text-base">{accounts.length} Akun</span>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="text-emerald-100 block">Status</span>
              <span className="font-bold text-base text-emerald-300">Aktif & Aman</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isSelected = activeAccount?.id === acc.id;

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: acc.color }}
                  >
                    <DynamicIcon name={acc.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {acc.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 uppercase font-semibold">
                      {acc.type} {acc.accountNumber ? `• ${acc.accountNumber}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingAccount(acc)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Edit Akun"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      onClick={() => setConfirmDelete({ id: acc.id, name: acc.name })}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Saldo Saat Ini</span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(acc.balance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Account's Transaction History */}
      {activeAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Transaksi: {activeAccount.name}</span>
            </CardTitle>
            <span className="text-xs font-semibold text-zinc-500">
              {accountTransactions.length} Transaksi
            </span>
          </CardHeader>

          {accountTransactions.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              Belum ada mutasi transaksi pada akun ini
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {accountTransactions.map((tx) => {
                const cat = categoriesMap.get(tx.categoryId);
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                const isSender = tx.accountId === activeAccount.id;

                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/30 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {isTransfer
                          ? isSender
                            ? `Pindah saldo ke akun lain`
                            : `Menerima pindah saldo`
                          : cat?.name || 'Transaksi'}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {tx.notes ? `${tx.notes} • ` : ''}
                        {formatDate(tx.date)}
                      </p>
                    </div>

                    <div className="text-right font-bold text-sm">
                      <span
                        className={
                          isIncome || (isTransfer && !isSender)
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }
                      >
                        {isIncome || (isTransfer && !isSender) ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <AccountModal
        isOpen={isAddAccountOpen || !!editingAccount}
        onClose={() => {
          setIsAddAccountOpen(false);
          setEditingAccount(null);
        }}
        initialAccount={editingAccount}
      />

      <TransactionModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        initialTransaction={{ type: 'transfer' } as any}
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Akun / Dompet?"
        message={`Apakah Anda yakin ingin menghapus akun "${confirmDelete?.name}"?`}
        confirmText="Hapus Akun"
        variant="danger"
      />
    </div>
  );
};
