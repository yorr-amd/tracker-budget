import { Account, Category } from '@/types';

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_cash_1',
    name: 'Dompet Tunai',
    type: 'cash',
    balance: 0,
    icon: 'Wallet',
    color: '#10B981', // Emerald
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_bank_bca',
    name: 'Bank BCA',
    type: 'bank',
    balance: 0,
    icon: 'Landmark',
    color: '#3B82F6', // Blue
    accountNumber: '',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_ewallet_gopay',
    name: 'GoPay',
    type: 'ewallet',
    balance: 0,
    icon: 'Smartphone',
    color: '#06B6D4', // Cyan
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_ewallet_dana',
    name: 'DANA',
    type: 'ewallet',
    balance: 0,
    icon: 'Smartphone',
    color: '#0284C7', // Sky
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // EXPENSES
  {
    id: 'cat_food',
    name: 'Makan & Minum',
    type: 'expense',
    icon: 'Utensils',
    color: '#F59E0B', // Amber
    isDefault: true,
  },
  {
    id: 'cat_groceries',
    name: 'Belanja Kebutuhan',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#10B981', // Emerald
    isDefault: true,
  },
  {
    id: 'cat_transport',
    name: 'Transportasi & Bensin',
    type: 'expense',
    icon: 'Car',
    color: '#3B82F6', // Blue
    isDefault: true,
  },
  {
    id: 'cat_bills',
    name: 'Tagihan & Utilitas',
    type: 'expense',
    icon: 'Zap',
    color: '#EF4444', // Red
    isDefault: true,
  },
  {
    id: 'cat_entertainment',
    name: 'Hiburan & Hobi',
    type: 'expense',
    icon: 'Gamepad2',
    color: '#EC4899', // Pink
    isDefault: true,
  },
  {
    id: 'cat_health',
    name: 'Kesehatan & Obat',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#14B8A6', // Teal
    isDefault: true,
  },
  {
    id: 'cat_education',
    name: 'Pendidikan & Kursus',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#8B5CF6', // Purple
    isDefault: true,
  },
  {
    id: 'cat_clothing',
    name: 'Pakaian & Fashion',
    type: 'expense',
    icon: 'Shirt',
    color: '#F97316', // Orange
    isDefault: true,
  },
  {
    id: 'cat_other_expense',
    name: 'Pengeluaran Lainnya',
    type: 'expense',
    icon: 'MoreHorizontal',
    color: '#6B7280', // Gray
    isDefault: true,
  },

  // INCOMES
  {
    id: 'cat_salary',
    name: 'Gaji Utama',
    type: 'income',
    icon: 'Briefcase',
    color: '#10B981', // Emerald
    isDefault: true,
  },
  {
    id: 'cat_bonus',
    name: 'Bonus & THR',
    type: 'income',
    icon: 'Gift',
    color: '#3B82F6', // Blue
    isDefault: true,
  },
  {
    id: 'cat_freelance',
    name: 'Side Project / Freelance',
    type: 'income',
    icon: 'Laptop',
    color: '#8B5CF6', // Purple
    isDefault: true,
  },
  {
    id: 'cat_investment_return',
    name: 'Dividen & Investasi',
    type: 'income',
    icon: 'TrendingUp',
    color: '#06B6D4', // Cyan
    isDefault: true,
  },
  {
    id: 'cat_other_income',
    name: 'Pemasukan Lainnya',
    type: 'income',
    icon: 'Coins',
    color: '#F59E0B', // Amber
    isDefault: true,
  },
];

export const ICON_OPTIONS = [
  'Wallet',
  'Landmark',
  'Smartphone',
  'CreditCard',
  'TrendingUp',
  'Utensils',
  'ShoppingCart',
  'Car',
  'Zap',
  'Gamepad2',
  'HeartPulse',
  'GraduationCap',
  'Shirt',
  'Briefcase',
  'Gift',
  'Laptop',
  'Coins',
  'Home',
  'Fuel',
  'Plane',
  'Coffee',
  'Film',
  'PiggyBank',
  'Target',
  'ShieldCheck',
  'Tag',
  'Receipt',
  'Package',
  'MoreHorizontal',
];

export const COLOR_OPTIONS = [
  { label: 'Emerald', value: '#10B981' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Gray', value: '#64748B' },
];
