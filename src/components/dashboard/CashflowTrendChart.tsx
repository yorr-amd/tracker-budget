import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/types';
import { BarChart3 } from 'lucide-react';

interface CashflowTrendChartProps {
  transactions: Transaction[];
}

export const CashflowTrendChart: React.FC<CashflowTrendChartProps> = ({ transactions }) => {
  const datesMap = new Map<string, { date: string; income: number; expense: number }>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
    datesMap.set(dateStr, { date: displayDate, income: 0, expense: 0 });
  }

  transactions.forEach((t) => {
    if (datesMap.has(t.date)) {
      const entry = datesMap.get(t.date)!;
      if (t.type === 'income') {
        entry.income += t.amount;
      } else if (t.type === 'expense') {
        entry.expense += t.amount;
      }
    }
  });

  const chartData = Array.from(datesMap.values());

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-zinc-800 space-y-1">
          <p className="font-semibold text-zinc-300">{label}</p>
          <p className="text-emerald-400 font-medium">
            Pemasukan: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-rose-400 font-medium">
            Pengeluaran: {formatCurrency(payload[1]?.value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>Tren Arus Kas (7 Hari Terakhir)</span>
        </CardTitle>
      </CardHeader>

      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}k` : `${v}`)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => (value === 'income' ? 'Pemasukan' : 'Pengeluaran')}
            />
            <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
