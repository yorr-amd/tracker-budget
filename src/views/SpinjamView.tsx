import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Installment } from '@/types';
import {
  HandCoins,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';
import { InstallmentModal } from '@/components/forms/InstallmentModal';

export const SpinjamView: React.FC = () => {
  const { installments, accounts, payInstallment, deleteInstallment } = useBudgetStore();
  const { toast } = useToast();

  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('active');
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [confirmPay, setConfirmPay] = useState<Installment | null>(null);

  const accountsMap = new Map(accounts.map((a) => [a.id, a.name]));

  // Hanya ambil cicilan bertipe 'spinjam'
  const spinjamItems = installments.filter((i) => i.type === 'spinjam');

  // Metrik
  const activeItems = spinjamItems.filter((i) => !i.isCompleted);
  const completedItems = spinjamItems.filter((i) => i.isCompleted);

  const totalMonthlyCommitment = activeItems.reduce((sum, i) => sum + i.monthlyAmount, 0);
  const totalRemainingDebt = activeItems.reduce(
    (sum, i) => sum + Math.max(0, i.totalTenorMonths - i.currentInstallment + 1) * i.monthlyAmount,
    0
  );

  // Filter tampilan
  const filteredList = spinjamItems.filter((item) => {
    if (filterTab === 'active') return !item.isCompleted;
    if (filterTab === 'completed') return item.isCompleted;
    return true;
  });

  const handlePayNow = async (inst: Installment) => {
    setPayingId(inst.id);
    try {
      await payInstallment(inst.id, new Date().toISOString().split('T')[0]);
      const isFinishing = inst.currentInstallment >= inst.totalTenorMonths;
      toast.success(
        isFinishing
          ? `Angsuran terakhir untuk pinjaman "${inst.title}" (${formatCurrency(inst.monthlyAmount)}) berhasil dibayar! Pinjaman ini sekarang LUNAS 🎉`
          : `Pembayaran angsuran ke-${inst.currentInstallment} "${inst.title}" (${formatCurrency(inst.monthlyAmount)}) berhasil dicatat!`,
        'Pembayaran Berhasil'
      );
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencatat pembayaran angsuran', 'Gagal Membayar');
    } finally {
      setPayingId(null);
      setConfirmPay(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteInstallment(confirmDelete.id);
      toast.success(`Data pinjaman SPinjam "${confirmDelete.title}" berhasil dihapus.`, 'Berhasil Dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pinjaman', 'Gagal');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
              Shopee Pinjam
            </span>
            <span className="text-xs text-zinc-400 font-medium">• Pinjaman Tunai</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-1">
            <HandCoins className="w-6 h-6 text-[#EA580C]" />
            <span>Cicilan SPinjam</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Pantau kewajiban angsuran dana tunai Shopee Pinjam, sisa pinjaman, dan tanggal jatuh tempo
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-[#EA580C] hover:bg-[#c2410c] shadow-md shadow-[#EA580C]/20 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-1" />
          Tambah Pinjaman SPinjam
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-[#EA580C] via-[#f97316] to-[#c2410c] text-white border-0 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-semibold text-orange-100 uppercase tracking-wider block">
              Total Angsuran Bulan Ini
            </span>
            <p className="text-2xl sm:text-3xl font-black mt-1">
              {formatCurrency(totalMonthlyCommitment)}
            </p>
            <p className="text-xs text-orange-100/80 mt-1">
              {activeItems.length} pinjaman SPinjam berjalan
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        </Card>

        <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Sisa Total Hutang Pokok
          </span>
          <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            {formatCurrency(totalRemainingDebt)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Estimasi total angsuran hingga seluruh pinjaman lunas
          </p>
        </Card>

        <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Status Pinjaman
          </span>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {completedItems.length}
              </span>
              <span className="text-xs text-zinc-500 ml-1">Lunas</span>
            </div>
            <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
              <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {activeItems.length}
              </span>
              <span className="text-xs text-zinc-500 ml-1">Berjalan</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {[
          { id: 'active', label: `Sedang Berjalan (${activeItems.length})` },
          { id: 'all', label: `Semua (${spinjamItems.length})` },
          { id: 'completed', label: `Sudah Lunas (${completedItems.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === tab.id
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Pinjaman */}
      {filteredList.length === 0 ? (
        <Card className="py-16 text-center text-zinc-400">
          <HandCoins className="w-12 h-12 stroke-[1.2] mx-auto mb-2 opacity-40 text-[#EA580C]" />
          <p className="text-sm font-medium">
            {filterTab === 'active'
              ? 'Tidak ada pinjaman SPinjam yang sedang berjalan'
              : filterTab === 'completed'
              ? 'Belum ada pinjaman SPinjam yang berstatus lunas'
              : 'Belum ada pinjaman SPinjam yang dicatat'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Catat pinjaman modal usaha, dana darurat, atau kebutuhan lainnya dari Shopee Pinjam
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4 bg-[#EA580C] hover:bg-[#c2410c] text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Tambah Pinjaman SPinjam
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((inst) => {
            const accName = accountsMap.get(inst.accountId) || 'Akun Sumber';
            const progressPercent = Math.min(
              100,
              Math.round((inst.currentInstallment / inst.totalTenorMonths) * 100)
            );
            const remainingMonths = Math.max(0, inst.totalTenorMonths - inst.currentInstallment + 1);
            const remainingAmount = remainingMonths * inst.monthlyAmount;

            return (
              <Card
                key={inst.id}
                className={`p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                  inst.isCompleted
                    ? 'opacity-70 bg-zinc-50 dark:bg-zinc-900/40 border-emerald-200 dark:border-emerald-950/40'
                    : 'hover:border-[#EA580C]/50 dark:hover:border-[#EA580C]/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#EA580C] flex items-center justify-center font-bold">
                        <HandCoins className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {inst.title}
                          </h4>
                          {inst.isCompleted ? (
                            <Badge variant="success" size="sm">
                              Lunas 🎉
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Angsuran {inst.currentInstallment}/{inst.totalTenorMonths}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Bayar via {accName} • Jatuh tempo tgl {inst.dueDayOfMonth}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingInstallment(inst)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        aria-label="Edit Pinjaman"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: inst.id, title: inst.title })}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        aria-label="Hapus Pinjaman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar Tenor */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-500">Progres Pelunasan Pinjaman</span>
                      <span className="text-[#EA580C]">
                        {inst.isCompleted
                          ? '100% Selesai'
                          : `${inst.currentInstallment}/${inst.totalTenorMonths} Bulan (${progressPercent}%)`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          inst.isCompleted ? 'bg-emerald-500' : 'bg-[#EA580C]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Info Nominal */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block">Angsuran per Bulan</span>
                      <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(inst.monthlyAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block">
                        {inst.isCompleted ? 'Total Pinjaman' : 'Sisa Hutang Pokok'}
                      </span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {inst.isCompleted
                          ? formatCurrency(inst.totalAmount || inst.monthlyAmount * inst.totalTenorMonths)
                          : formatCurrency(remainingAmount)}
                      </span>
                    </div>
                  </div>

                  {inst.notes && (
                    <p className="mt-2 text-[11px] text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-lg">
                      {inst.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Jatuh Tempo: {formatDate(inst.nextDueDate)}</span>
                  </div>

                  {!inst.isCompleted ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setConfirmPay(inst)}
                      isLoading={payingId === inst.id}
                      className="bg-[#EA580C] hover:bg-[#c2410c] text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Bayar Angsuran
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Lunas
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      <InstallmentModal
        isOpen={isAddModalOpen || !!editingInstallment}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingInstallment(null);
        }}
        type="spinjam"
        initialInstallment={editingInstallment}
      />

      {/* Modal Hapus */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Data Pinjaman SPinjam?"
        message={`Apakah Anda yakin ingin menghapus data pinjaman "${confirmDelete?.title}"?`}
        confirmText="Hapus"
        variant="danger"
      />

      {/* Modal Bayar */}
      {confirmPay && (
        <ConfirmModal
          isOpen={!!confirmPay}
          onClose={() => setConfirmPay(null)}
          onConfirm={() => handlePayNow(confirmPay)}
          title="Catat Pembayaran Angsuran SPinjam?"
          message={`Akan dicatat pengeluaran angsuran ke-${confirmPay.currentInstallment} sebesar ${formatCurrency(
            confirmPay.monthlyAmount
          )} dari dompet "${accountsMap.get(confirmPay.accountId) || 'Akun'}".`}
          confirmText="Bayar Sekarang"
          variant="primary"
        />
      )}
    </div>
  );
};
