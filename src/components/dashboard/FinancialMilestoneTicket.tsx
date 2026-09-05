import React from 'react';
import { Ticket, Sparkles, Trophy, Flame, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActiveTab } from '@/types';

interface FinancialMilestoneTicketProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const FinancialMilestoneTicket: React.FC<FinancialMilestoneTicketProps> = ({
  onNavigate,
}) => {
  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#7b1824', '#f59e0b', '#fbbf24', '#10b981'],
    });
    onNavigate('goals');
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-100/80 via-rose-50 to-amber-50 dark:from-zinc-900 dark:via-[#260f15] dark:to-zinc-900 border border-amber-200/80 dark:border-rose-950/70 p-6 sm:p-7 shadow-xs">
      {/* Decorative Confetti Background Dots */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-3 left-10 w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
        <div className="absolute top-6 right-20 w-2 h-2 rounded-full bg-rose-400" />
        <div className="absolute bottom-4 left-1/3 w-2.5 h-2.5 rounded-full bg-[#7b1824]" />
        <div className="absolute bottom-6 right-12 w-2 h-2 rounded-full bg-emerald-400" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Golden Ticket Illustration (Matching The Magical Ticket) */}
        <div className="flex items-center gap-5">
          {/* Ticket Visual */}
          <div className="relative w-24 h-16 sm:w-28 sm:h-20 bg-gradient-to-tr from-amber-400 to-amber-300 rounded-xl shadow-md border-2 border-amber-500/40 flex items-center justify-center text-amber-950 transform -rotate-3 hover:rotate-0 transition-transform shrink-0">
            {/* Ticket Notches */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#fcf8f7] dark:bg-zinc-900 border-r border-amber-500/40" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#fcf8f7] dark:bg-zinc-900 border-l border-amber-500/40" />

            <div className="flex flex-col items-center">
              <Ticket className="w-7 h-7 sm:w-8 sm:h-8 text-amber-900 stroke-[2]" />
              <span className="text-[9px] font-black tracking-widest uppercase text-amber-950 mt-0.5">
                MILESTONE
              </span>
            </div>
          </div>

          {/* Texts */}
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Financial Streak Badge</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-[#7b1824] dark:text-rose-200">
              FINANCIAL GOALS MILESTONE
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
              Disiplin catat keuangan & hemat pengeluaran selama 30 hari berturut-turut untuk menjaga kesehatan finansialmu!
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>30-Hari Disiplin</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Trophy className="w-3.5 h-3.5" />
                <span>100% Bebas Defisit</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: CTA Button ("UNLOCK NOW" in Dakingo style) */}
        <div className="shrink-0">
          <button
            onClick={handleTriggerConfetti}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7b1824] hover:bg-[#60111b] active:scale-95 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-[#7b1824]/20 hover:shadow-lg transition-all cursor-pointer group"
          >
            <span>Cek Target Sekarang</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
