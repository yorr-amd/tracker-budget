import React from 'react';
import { Plus, ArrowRight, ShieldCheck, Sparkles, Wallet, Flame } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ActiveTab } from '@/types';

interface HeroBannerProps {
  totalBalance: number;
  netSavings: number;
  onOpenTransactionModal: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  totalBalance,
  netSavings,
  onOpenTransactionModal,
  onNavigate,
}) => {
  const isHealthy = netSavings >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#420911] via-[#6e121e] to-[#8d1827] text-white shadow-xl shadow-[#5c0f1a]/25 border border-rose-900/30 p-6 sm:p-8 md:p-10 transition-all">
      {/* Decorative Radial Lights & Swirls */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />

      {/* Subtle decorative wave SVG */}
      <svg
        className="pointer-events-none absolute right-0 bottom-0 opacity-10 w-96 h-48 text-white"
        viewBox="0 0 400 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 100C150 160 250 40 400 100V200H0V100Z"
          fill="currentColor"
        />
      </svg>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left Column: Headline, Badge, Text, CTA */}
        <div className="max-w-2xl space-y-4">
          {/* Badge / Offer */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-rose-100 text-xs font-semibold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Free Analytics • 100% Offline & Private • Sync Devices</span>
          </div>

          {/* Main Display Headline */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase text-white leading-[1.1]">
              Master Your <span className="text-amber-300 drop-shadow-sm">Finances!</span>
            </h1>
            <p className="mt-1.5 text-rose-100/90 text-base sm:text-lg font-medium tracking-wide">
              Take Full Control of Your Daily Expenses
            </p>
          </div>

          {/* Subtitle Description */}
          <p className="text-xs sm:text-sm text-rose-200/80 leading-relaxed max-w-xl">
            Pantau arus kas real-time, alokasikan anggaran cerdas, dan raih target tabungan impian Anda dengan sistem finansial desktop yang cepat, privat, dan aman.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenTransactionModal}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-full bg-white hover:bg-amber-50 active:scale-95 text-[#6e121e] font-bold text-xs sm:text-sm shadow-lg shadow-black/20 hover:shadow-white/25 transition-all cursor-pointer group"
            >
              <Plus className="w-4 h-4 text-[#8d1827] stroke-[3]" />
              <span>Start Tracking Now</span>
              <ArrowRight className="w-4 h-4 text-[#8d1827] group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('budgets')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black/20 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              <span>Atur Anggaran</span>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-rose-200 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <span>Lihat Laporan &rarr;</span>
            </button>
          </div>
        </div>

        {/* Right Column: Floating Financial Badges */}
        <div className="flex flex-row lg:flex-col items-center sm:justify-end gap-3.5 lg:gap-4 shrink-0">
          {/* Badge 1: Saldo Utama (Besar) */}
          <div className="flex items-center gap-3.5 p-3 sm:p-4 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 shadow-lg min-w-[200px] sm:min-w-[240px] hover:bg-white/15 transition-all">
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-[#520d16] flex items-center justify-center text-amber-300">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-rose-200/90">
                Total Kekayaan Bersih
              </p>
              <p className="text-base sm:text-xl font-extrabold text-white tracking-tight">
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>

          {/* Badge 2: Financial Health Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md min-w-[180px] sm:min-w-[240px] hover:bg-white/15 transition-all">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white">Status Finansial</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                {isHealthy ? 'Arus Kas Surplus' : 'Perlu Efisiensi Biaya'}
              </p>
            </div>
          </div>

          {/* Badge 3: Streak Disiplin Hemat */}
          <div className="hidden sm:flex items-center gap-3 p-2.5 px-3.5 rounded-full bg-amber-500/20 border border-amber-400/30 backdrop-blur-md text-amber-200 text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>30-Hari Financial Streak Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
};
