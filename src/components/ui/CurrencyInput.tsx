import React from 'react';
import { formatNumber, parseNumberInput } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label = 'Nominal Transaksi',
  placeholder = '0',
  error,
  className,
  autoFocus,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const num = parseNumberInput(rawVal);
    onChange(num);
  };

  const formattedDisplay = value ? formatNumber(value) : '';

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-base font-semibold text-zinc-400 dark:text-zinc-500 select-none">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={formattedDisplay}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-lg font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 transition-all focus:bg-white dark:focus:bg-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
            error && 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500',
            className
          )}
        />
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
};
