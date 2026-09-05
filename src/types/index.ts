export type AccountType = 'cash' | 'bank' | 'ewallet' | 'credit' | 'investment';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
  accountNumber?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId?: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  toAccountId?: string; // Khusus transfer
  categoryId: string;
  type: TransactionType;
  amount: number;
  adminFee?: number; // Biaya transfer jika ada
  date: string; // Format YYYY-MM-DD
  time?: string; // Format HH:mm
  notes?: string;
  tags?: string[];
  receiptUrl?: string; // Base64 / image URL
  isRecurring?: boolean;
  goalId?: string; // ID target tabungan jika transaksi berupa alokasi/pencairan
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  period: string; // Format: YYYY-MM
  amountLimit: number;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  icon: string;
  color: string;
  notes?: string;
  isCompleted?: boolean;
  createdAt: string;
}

export interface SavingsLog {
  id: string;
  goalId: string;
  accountId: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  frequency: FrequencyType;
  dayOfMonth?: number; // 1-31
  nextDueDate: string;
  notes?: string;
  isActive: boolean;
  autoCreate: boolean;
  createdAt: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  expenseByCategory: {
    categoryId: string;
    categoryName: string;
    color: string;
    icon: string;
    amount: number;
    percentage: number;
  }[];
}

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'wallets'
  | 'budgets'
  | 'goals'
  | 'recurring'
  | 'reports'
  | 'settings';
