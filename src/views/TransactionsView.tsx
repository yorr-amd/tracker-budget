import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Transaction } from '@/types';
import {
  formatCurrency,
  formatDate,
  exportTransactionsToCSV,
} from '@/lib/utils';
import {
  Receipt,
  Search,
  Download,
  Plus,
  Trash2,
  Edit2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Image as ImageIcon,
} from 'lucide-react';
import { TransactionModal } from '@/components/forms/TransactionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

export const TransactionsView: React.FC = () => {
  const { transactions, accounts, categories, deleteTransaction } = useBudgetStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [confirmDeleteTx, setConfirmDeleteTx] = useState<{ id: string; notes?: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  const accountsMap = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (
        searchQuery &&
        !t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !categoriesMap.get(t.categoryId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (selectedAccount !== 'all' && t.accountId !== selectedAccount && t.toAccountId !== selectedAccount) {
        return false;
      }
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
      if (selectedMonth && !t.date.startsWith(selectedMonth)) return false;

      return true;
    });
  }, [transactions, searchQuery, selectedType, selectedAccount, selectedCategory, selectedMonth, categoriesMap]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });
    return {
      count: filteredTransactions.length,
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const catNameMap = new Map(categories.map((c) => [c.id, c.name]));
    exportTransactionsToCSV(filteredTransactions, accountsMap, catNameMap);
    toast.success(`Berhasil mengekspor ${filteredTransactions.length} transaksi ke file CSV!`, 'Ekspor CSV');
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTx) return;
    try {
      await deleteTransaction(confirmDeleteTx.id);
      toast.success('Transaksi berhasil dihapus dan saldo akun dikembalikan otomatis.', 'Transaksi Dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus transaksi', 'Terjadi Kesalahan');
    } finally {
      setConfirmDeleteTx(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>Riwayat Transaksi</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Kelola, cari, dan ekspor semua catatan pengeluaran & pemasukan
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Baru
          </Button>
        </div>
      </div>

      {/* Filters & Search Card */}
      <Card className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Cari transaksi atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Semua Jenis</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="transfer">Pindah Saldo</option>
            </select>
          </div>

          <div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Semua Akun / Dompet</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">
            Menampilkan {stats.count} transaksi
          </span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Masuk: +{formatCurrency(stats.income)}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              Keluar: -{formatCurrency(stats.expense)}
            </span>
            <span className="text-zinc-800 dark:text-zinc-200 font-bold border-l pl-4 border-zinc-200 dark:border-zinc-700">
              Net: {formatCurrency(stats.net)}
            </span>
          </div>
        </div>
      </Card>

      {/* Transactions Table / List */}
      <Card className="p-0 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
            <Receipt className="w-12 h-12 stroke-[1.2] mb-2 opacity-40" />
            <p className="text-sm font-medium">Tidak ada transaksi yang cocok</p>
            <p className="text-xs text-zinc-400 mt-1">Coba sesuaikan kata kunci atau filter</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredTransactions.map((tx) => {
              const cat = categoriesMap.get(tx.categoryId);
              const sourceAccName = accountsMap.get(tx.accountId) || 'Akun';
              const toAccName = tx.toAccountId ? accountsMap.get(tx.toAccountId) || 'Tujuan' : '';

              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                        isTransfer
                          ? 'bg-blue-600'
                          : isIncome
                          ? 'bg-emerald-600'
                          : ''
                      }`}
                      style={!isTransfer && !isIncome && cat?.color ? { backgroundColor: cat.color } : undefined}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="w-5 h-5" />
                      ) : isIncome ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <DynamicIcon name={cat?.icon || 'Tag'} className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {isTransfer
                            ? `Transfer ke ${toAccName}`
                            : cat?.name || 'Transaksi'}
                        </h4>
                        {isTransfer ? (
                          <Badge variant="info" size="sm">Transfer</Badge>
                        ) : isIncome ? (
                          <Badge variant="success" size="sm">Pemasukan</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Pengeluaran</Badge>
                        )}
                        {tx.receiptUrl && (
                          <button
                            onClick={() => setPreviewReceipt(tx.receiptUrl!)}
                            className="text-zinc-400 hover:text-emerald-600 cursor-pointer"
                            title="Lihat Struk"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{sourceAccName}</span>
                        {tx.adminFee ? ` (Admin: ${formatCurrency(tx.adminFee)})` : ''} • {formatDate(tx.date)} {tx.time ? `• ${tx.time}` : ''}
                      </p>
                      {tx.notes && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded inline-block">
                          "{tx.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0 pl-14 sm:pl-0">
                    <p
                      className={`text-base font-bold ${
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

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTransaction(tx)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteTx({ id: tx.id, notes: tx.notes })}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <TransactionModal
        isOpen={isAddModalOpen || !!editingTransaction}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
      />

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
        message={`Apakah Anda yakin ingin menghapus transaksi "${confirmDeleteTx?.notes || 'ini'}"? Saldo dompet akan disesuaikan kembali secara otomatis.`}
        confirmText="Hapus Transaksi"
        variant="danger"
      />
    </div>
  );
};
