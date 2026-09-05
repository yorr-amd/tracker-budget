import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  initializeDatabase,
  createTransaction,
  deleteTransaction,
  updateTransaction,
  depositSavingsGoal,
  withdrawSavingsGoal,
  resetAllDataToDefault,
  exportDatabaseBackup,
  importDatabaseBackup,
} from '@/lib/db';
import {
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  RecurringTransaction,
  FinancialSummary,
} from '@/types';
import { getCurrentPeriod, generateId } from '@/lib/utils';

export function useBudgetStore() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeDatabase().then(() => setIsInitialized(true));
  }, []);

  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const transactions =
    useLiveQuery(
      () => db.transactions.reverse().sortBy('date'),
      []
    ) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const savingsGoals = useLiveQuery(() => db.savingsGoals.toArray(), []) || [];
  const savingsLogs = useLiveQuery(() => db.savingsLogs.toArray(), []) || [];
  const recurringTransactions =
    useLiveQuery(() => db.recurringTransactions.toArray(), []) || [];

  // Hitung ringkasan finansial (Total Saldo, Pemasukan, Pengeluaran Bulan Ini)
  const calculateSummary = (period: string = getCurrentPeriod()): FinancialSummary => {
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const monthTransactions = transactions.filter((t) => t.date.startsWith(period));

    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpendingMap = new Map<string, number>();

    monthTransactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
        const current = categorySpendingMap.get(t.categoryId) || 0;
        categorySpendingMap.set(t.categoryId, current + t.amount);
      }
    });

    const expenseByCategory = Array.from(categorySpendingMap.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          categoryId: catId,
          categoryName: cat?.name || 'Lainnya',
          color: cat?.color || '#6B7280',
          icon: cat?.icon || 'Tag',
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      expenseByCategory,
    };
  };

  // Helper untuk mendapatkan pengeluaran aktual per kategori untuk budget
  const getCategorySpending = (categoryId: string, period: string = getCurrentPeriod()): number => {
    return transactions
      .filter((t) => t.categoryId === categoryId && t.type === 'expense' && t.date.startsWith(period))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Akun Actions
  const addAccount = async (account: Omit<Account, 'id' | 'createdAt'>) => {
    const id = generateId();
    await db.accounts.add({
      ...account,
      id,
      createdAt: new Date().toISOString(),
    });
    return id;
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    await db.accounts.update(id, updates);
  };

  const deleteAccount = async (id: string) => {
    const count = await db.transactions.where('accountId').equals(id).count();
    if (count > 0) {
      throw new Error(`Tidak bisa menghapus akun karena memiliki ${count} riwayat transaksi.`);
    }
    await db.accounts.delete(id);
  };

  // Kategori Actions
  const addCategory = async (category: Omit<Category, 'id'>) => {
    const id = generateId();
    await db.categories.add({ ...category, id });
    return id;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await db.categories.update(id, updates);
  };

  const deleteCategory = async (id: string) => {
    const count = await db.transactions.where('categoryId').equals(id).count();
    if (count > 0) {
      throw new Error(`Kategori tidak dapat dihapus karena telah digunakan pada ${count} transaksi.`);
    }
    await db.categories.delete(id);
  };

  // Budget Actions
  const setBudget = async (categoryId: string, amountLimit: number, period: string = getCurrentPeriod()) => {
    const existing = await db.budgets.where({ categoryId, period }).first();
    if (existing) {
      await db.budgets.update(existing.id, { amountLimit });
    } else {
      await db.budgets.add({
        id: generateId(),
        categoryId,
        period,
        amountLimit,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const deleteBudget = async (id: string) => {
    await db.budgets.delete(id);
  };

  // Savings Goal Actions
  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'isCompleted' | 'createdAt'>) => {
    const id = generateId();
    await db.savingsGoals.add({
      ...goal,
      id,
      currentAmount: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });
    return id;
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    await db.savingsGoals.update(id, updates);
  };

  const deleteSavingsGoal = async (id: string) => {
    await db.savingsGoals.delete(id);
    await db.savingsLogs.where('goalId').equals(id).delete();
  };

  // Recurring Transactions Actions
  const addRecurring = async (rec: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
    const id = generateId();
    await db.recurringTransactions.add({
      ...rec,
      id,
      createdAt: new Date().toISOString(),
    });
    return id;
  };

  const toggleRecurringActive = async (id: string, isActive: boolean) => {
    await db.recurringTransactions.update(id, { isActive });
  };

  const updateRecurring = async (id: string, updates: Partial<RecurringTransaction>) => {
    await db.recurringTransactions.update(id, updates);
  };

  const deleteRecurring = async (id: string) => {
    await db.recurringTransactions.delete(id);
  };

  return {
    isInitialized,
    accounts,
    categories,
    transactions,
    budgets,
    savingsGoals,
    savingsLogs,
    recurringTransactions,
    calculateSummary,
    getCategorySpending,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    depositSavingsGoal,
    withdrawSavingsGoal,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    setBudget,
    deleteBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addRecurring,
    updateRecurring,
    toggleRecurringActive,
    deleteRecurring,
    resetAllDataToDefault,
    exportDatabaseBackup,
    importDatabaseBackup,
  };
}
