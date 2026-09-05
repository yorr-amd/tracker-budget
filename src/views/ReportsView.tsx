import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { formatCurrency, getCurrentPeriod, formatDate } from '@/lib/utils';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Printer,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { transactions, categories, accounts, calculateSummary } = useBudgetStore();
  const [period, setPeriod] = useState(getCurrentPeriod());

  const summary = calculateSummary(period);
  const monthTransactions = transactions.filter((t) => t.date.startsWith(period));

  const accountsMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Laporan & Analitik Finansial</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Laporan ringkasan arus kas, laba bersih, dan pengeluaran per kategori
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* Printable Statement Header */}
      <div className="hidden print:block border-b border-zinc-300 pb-4 mb-4">
        <h2 className="text-2xl font-bold text-zinc-900">Laporan Arus Kas Bulanan</h2>
        <p className="text-xs text-zinc-600">Periode: {period} • Dibuat secara otomatis oleh Tracker Budget Desktop</p>
      </div>

      {/* Financial Statement Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
            Total Pemasukan
          </span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            +{formatCurrency(summary.totalIncome)}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-1">
            {monthTransactions.filter((t) => t.type === 'income').length} transaksi pemasukan
          </p>
        </Card>

        <Card className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase">
            Total Pengeluaran
          </span>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
            -{formatCurrency(summary.totalExpense)}
          </p>
          <p className="text-[11px] text-rose-600/80 mt-1">
            {monthTransactions.filter((t) => t.type === 'expense').length} transaksi pengeluaran
          </p>
        </Card>

        <Card className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60">
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">
            Sisa Arus Kas Bersih
          </span>
          <p
            className={`text-2xl font-bold mt-1 ${
              summary.netSavings >= 0
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {formatCurrency(summary.netSavings)}
          </p>
          <p className="text-[11px] text-blue-600/80 mt-1">
            {summary.totalIncome > 0
              ? `Tingkat Tabungan: ${Math.max(0, Math.round((summary.netSavings / summary.totalIncome) * 100))}%`
              : '0%'}
          </p>
        </Card>
      </div>

      {/* Category Breakdown Table & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rincian Pengeluaran per Kategori</CardTitle>
          </CardHeader>

          {summary.expenseByCategory.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              Tidak ada pengeluaran pada periode {period}
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto max-h-80 pr-1">
              {summary.expenseByCategory.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {cat.categoryName}
                      </p>
                      <div className="w-28 sm:w-36 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: cat.color,
                            width: `${cat.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(cat.amount)}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {cat.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Donut Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Distribusi Pengeluaran Visual</CardTitle>
          </CardHeader>

          {summary.expenseByCategory.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs">
              Belum ada data untuk digambarkan
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(v: any) => formatCurrency(Number(v))}
                  />
                  <Pie
                    data={summary.expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {summary.expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value, entry: any) => entry.payload?.categoryName || value}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Detailed Transactions Log */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <CardTitle>Daftar Mutasi Transaksi ({period})</CardTitle>
          <span className="text-xs text-zinc-500">{monthTransactions.length} Transaksi</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Akun</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {monthTransactions.map((tx) => {
                const cat = categoriesMap.get(tx.categoryId);
                const isIncome = tx.type === 'income';

                return (
                  <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                      {cat?.name || 'Lainnya'}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {accountsMap.get(tx.accountId) || 'Akun'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 italic max-w-xs truncate">
                      {tx.notes || '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
