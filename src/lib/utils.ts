import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function parseNumberInput(value: string): number {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateString);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = parseLocalDate(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Hari ini';
  if (isYesterday) return 'Kemarin';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatFullDate(dateString: string): string {
  if (!dateString) return '';
  const date = parseLocalDate(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function calculateNextDueDate(
  currentDateString: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  dayOfMonth?: number
): string {
  const baseDate = parseLocalDate(currentDateString);
  if (isNaN(baseDate.getTime())) {
    return getTodayDateString();
  }

  const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  if (frequency === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === 'monthly') {
    const targetDay = dayOfMonth || baseDate.getDate();
    // Advance month
    const targetMonth = nextDate.getMonth() + 1;
    nextDate.setMonth(targetMonth, 1); // Set to 1st to avoid overflow
    const maxDaysInNextMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
    nextDate.setDate(Math.min(targetDay, maxDaysInNextMonth));
  } else if (frequency === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function exportDataToJSON(data: object, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${getTodayDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(
  transactions: any[],
  accountsMap: Map<string, string>,
  categoriesMap: Map<string, string>
) {
  const headers = [
    'Tanggal',
    'Jenis',
    'Akun Sumber',
    'Akun Tujuan',
    'Kategori',
    'Nominal (IDR)',
    'Biaya Admin',
    'Catatan',
  ];

  const rows = transactions.map((t) => {
    const typeLabel =
      t.type === 'income'
        ? 'Pemasukan'
        : t.type === 'expense'
        ? 'Pengeluaran'
        : 'Transfer';
    const accName = accountsMap.get(t.accountId) || t.accountId;
    const toAccName = t.toAccountId ? accountsMap.get(t.toAccountId) || t.toAccountId : '-';
    const catName = categoriesMap.get(t.categoryId) || t.categoryId;
    const note = t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '""';

    return [
      t.date,
      typeLabel,
      `"${accName}"`,
      `"${toAccName}"`,
      `"${catName}"`,
      t.amount,
      t.adminFee || 0,
      note,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `riwayat_transaksi_${getTodayDateString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
