import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { FinancialSummary } from '@/types';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ExpenseBreakdownChartProps {
  summary: FinancialSummary;
}

export const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ summary }) => {
  const data = summary.expenseByCategory;

  if (data.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-emerald-600" />
            <span>Kategori Pengeluaran</span>
          </CardTitle>
        </CardHeader>
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500">
          <PieChartIcon className="w-12 h-12 stroke-[1.2] mb-2 opacity-40" />
          <p className="text-xs">Belum ada data pengeluaran bulan ini</p>
        </div>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-zinc-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-zinc-800">
          <p className="font-semibold">{item.categoryName}</p>
          <p className="text-emerald-400 font-bold mt-0.5">{formatCurrency(item.amount)}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">{item.percentage.toFixed(1)}% dari total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-emerald-600" />
          <span>Kategori Pengeluaran Bulan Ini</span>
        </CardTitle>
      </CardHeader>

      <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
        {/* Pie Chart Donut */}
        <div className="w-full sm:w-1/2 h-56 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="amount"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Total</span>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(summary.totalExpense)}
            </span>
          </div>
        </div>

        {/* Categories Breakdown List */}
        <div className="w-full sm:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-1">
          {data.map((item) => (
            <div
              key={item.categoryId}
              className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
                  {item.categoryName}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.amount)}
                </span>
                <span className="text-[10px] text-zinc-400 ml-1.5 font-medium">
                  ({item.percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
