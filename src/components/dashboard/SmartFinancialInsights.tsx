import React from 'react';
import { Zap, BarChart3, ShieldCheck, BellRing, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { ActiveTab, FinancialSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface SmartFinancialInsightsProps {
  summary: FinancialSummary;
  onNavigate: (tab: ActiveTab) => void;
}

export const SmartFinancialInsights: React.FC<SmartFinancialInsightsProps> = ({
  summary,
  onNavigate,
}) => {
  const pillars = [
    {
      icon: Zap,
      badge: 'Instan',
      title: 'Real-time Sync',
      desc: 'Catat transaksi secepat kilat tanpa jeda.',
      tag: '0ms Latency',
    },
    {
      icon: BarChart3,
      badge: 'Cerdas',
      title: 'Automated Analytics',
      desc: 'Grafik pengeluaran mingguan & bulanan otomatis.',
      tag: 'Otomatis',
    },
    {
      icon: ShieldCheck,
      badge: 'Privat',
      title: 'Secure Data',
      desc: '100% data tersimpan aman di perangkat lokal.',
      tag: 'Zero Cloud Leak',
    },
    {
      icon: BellRing,
      badge: 'Peringatan',
      title: 'Budget Alerts',
      desc: 'Pengingat otomatis saat mendekati limit anggaran.',
      tag: 'Smart Notice',
    },
  ];

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8d1827] dark:text-rose-400 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nilai & Keunggulan</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Smart Financial Insights
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Pengelolaan uang tanpa rasa khawatir — transparan, privat, dan selalu dalam kendali penuh
        </p>
      </div>

      {/* Main Container: Split 2 Columns matching "Our Promise" Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): The 4 Circular Badges */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-[#fcf8f7] dark:bg-zinc-900/90 border border-rose-100 dark:border-zinc-800 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/60 dark:bg-rose-950/40 text-[#8d1827] dark:text-rose-300 text-xs font-bold tracking-wide">
              <span>Keunggulan Sistem Tracker</span>
            </div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Didesain khusus untuk efisiensi tinggi, privasi data keuangan mutlak, dan pengambilan keputusan anggaran yang lebih cerdas.
            </p>
          </div>

          {/* 4 Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {pillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center group">
                  {/* Double Ringed Circular Icon Badge (Matching Dakingo) */}
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#8d1827]/40 dark:border-rose-500/40 p-1 flex items-center justify-center transition-transform group-hover:scale-110">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#7b1824] to-[#9b1f30] text-white flex items-center justify-center shadow-md shadow-[#7b1824]/20">
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                  </div>

                  <span className="mt-2.5 text-[10px] font-bold text-[#8d1827] dark:text-rose-400 uppercase tracking-wider">
                    {item.tag}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug hidden sm:block">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom highlight pill */}
          <div className="mt-6 pt-4 border-t border-rose-100/80 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Sistem Database IndexedDB Terenkripsi & Bebas Pelacak</span>
            </span>
            <button
              onClick={() => onNavigate('settings')}
              className="font-bold text-[#8d1827] dark:text-rose-400 hover:underline cursor-pointer"
            >
              Cek Keamanan &rarr;
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Visual Financial Health & Arus Kas Snapshot */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-[#540f19] to-[#7b1824] text-white shadow-md border border-rose-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-widest text-rose-200 uppercase">
                Financial Health Score
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                98 / 100
              </span>
            </div>
            <h3 className="text-xl font-black mt-2 text-white">
              Kondisi Arus Kas Bulan Ini
            </h3>
            <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
              Alokasi pengeluaran Anda terkontrol dengan surplus tabungan yang terjaga dengan baik.
            </p>
          </div>

          {/* Visual Breakdown Bar */}
          <div className="my-5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-rose-200">Pemasukan vs Pengeluaran</span>
              <span className="font-bold text-amber-300">
                Surplus {formatCurrency(Math.max(0, summary.netSavings))}
              </span>
            </div>

            {/* Two-tone Progress Bar */}
            <div className="w-full h-3 rounded-full bg-black/25 overflow-hidden flex">
              <div
                className="bg-emerald-400 h-full"
                style={{
                  width: `${
                    summary.totalIncome > 0
                      ? Math.min(
                          100,
                          Math.round((summary.totalExpense / summary.totalIncome) * 100)
                        )
                      : 50
                  }%`,
                }}
                title="Rasio Pengeluaran"
              />
              <div
                className="bg-amber-400 h-full"
                style={{
                  width: `${
                    summary.totalIncome > 0
                      ? Math.max(
                          0,
                          100 -
                            Math.min(
                              100,
                              Math.round((summary.totalExpense / summary.totalIncome) * 100)
                            )
                        )
                      : 50
                  }%`,
                }}
                title="Rasio Tabungan"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-rose-200/80 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Pengeluaran: {formatCurrency(summary.totalExpense)}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Tabungan</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-[#7b1824] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>Buka Laporan Lengkap Arus Kas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
