import React, { useState } from 'react';
import { Card, CardTitle } from '../ui/Card';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Transaction, ActiveTab } from '@/types';
import {
  Receipt,
  ArrowDownLeft,
  ArrowLeftRight,
  Trash2,
  Edit2,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';

import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../ui/Toast';

interface RecentTransactionsListProps {
  onEditTransaction: (tx: Transaction) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  onEditTransaction,
  onNavigate,
}) => {
  const { transactions, accounts, categories, deleteTransaction } = useBudgetStore();
  const { toast } = useToast();
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [confirmDeleteTx, setConfirmDeleteTx] = useState<{ id: string; notes?: string } | null>(null);

  const accountsMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

  const recentTxs = transactions.slice(0, 8);

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTx) return;
    try {
      await deleteTransaction(confirmDeleteTx.id);
      toast.success('Transaksi berhasil dihapus dan saldo akun disesuaikan.', 'Transaksi Dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus transaksi', 'Terjadi Kesalahan');
    } finally {
      setConfirmDeleteTx(null);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Transaksi Terbaru</span>
          </CardTitle>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-0.5 font-medium cursor-pointer"
          >
            <span>Semua Transaksi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500">
            <Receipt className="w-12 h-12 stroke-[1.2] mb-2 opacity-40" />
            <p className="text-xs">Belum ada transaksi tercatat</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-y-auto max-h-96 pr-1">
            {recentTxs.map((tx) => {
              const cat = categoriesMap.get(tx.categoryId);
              const sourceAccName = accountsMap.get(tx.accountId) || 'Akun';
              const toAccName = tx.toAccountId ? accountsMap.get(tx.toAccountId) || 'Tujuan' : '';

              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 px-2 rounded-xl transition-colors"
                >
                  {/* Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                        isTransfer
                          ? 'bg-blue-600'
                          : isIncome
                          ? 'bg-emerald-600'
                          : ''
                      }`}
                      style={!isTransfer && !isIncome && cat?.color ? { backgroundColor: cat.color } : undefined}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4" />
                      ) : isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <DynamicIcon name={cat?.icon || 'Tag'} className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {isTransfer
                            ? `Transfer ke ${toAccName}`
                            : cat?.name || 'Transaksi'}
                        </p>
                        {tx.receiptUrl && (
                          <button
                            onClick={() => setPreviewReceipt(tx.receiptUrl!)}
                            className="text-zinc-400 hover:text-emerald-600 cursor-pointer"
                            title="Lihat Struk"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {tx.notes ? `${tx.notes} • ` : ''}
                        {sourceAccName} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Quick Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-xs font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isTransfer
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {isIncome ? '+' : isTransfer ? '' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                      {tx.time && (
                        <p className="text-[10px] text-zinc-400 font-medium">{tx.time}</p>
                      )}
                    </div>

                    {/* Hover action buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteTx({ id: tx.id, notes: tx.notes })}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal Preview Struk */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative max-w-lg w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-3">
              <h4 className="text-sm font-semibold">Foto Struk Transaksi</h4>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <img
              src={previewReceipt}
              alt="Struk Preview"
              className="max-h-[70vh] w-auto mx-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* Confirm Delete Transaction Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteTx}
        onClose={() => setConfirmDeleteTx(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi?"
        message={`Apakah Anda yakin ingin menghapus transaksi "${confirmDeleteTx?.notes || 'ini'}"? Saldo akun akan dikembalikan secara otomatis.`}
        confirmText="Hapus Transaksi"
        variant="danger"
      />
    </>
  );
};
