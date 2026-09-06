import { useSyncExternalStore, useCallback } from 'react';
import {
  initializeDatabase,
  getAccounts,
  getCategories,
  getTransactions,
  getBudgets,
  getSavingsGoals,
  getSavingsLogs,
  getRecurringTransactions,
  getInstallments,
  createTransaction as dbCreateTransaction,
  deleteTransaction as dbDeleteTransaction,
  updateTransaction as dbUpdateTransaction,
  depositSavingsGoal as dbDepositSavingsGoal,
  withdrawSavingsGoal as dbWithdrawSavingsGoal,
  payInstallment as dbPayInstallment,
  resetAllDataToDefault as dbResetAll,
  exportDatabaseBackup,
  importDatabaseBackup as dbImportBackup,
  executeUpdate,
} from '@/lib/db';
import {
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  RecurringTransaction,
  Installment,
  FinancialSummary,
  SavingsLog,
} from '@/types';
import { getCurrentPeriod, generateId } from '@/lib/utils';

// Global state for Singleton store
let globalState = {
  isInitialized: false,
  accounts: [] as Account[],
  categories: [] as Category[],
  transactions: [] as Transaction[],
  budgets: [] as Budget[],
  savingsGoals: [] as SavingsGoal[],
  savingsLogs: [] as SavingsLog[],
  recurringTransactions: [] as RecurringTransaction[],
  installments: [] as Installment[],
};

const listeners = new Set<() => void>();

function emitChange() {
  globalState = { ...globalState };
  listeners.forEach((listener) => listener());
}

let isFetching = false;
async function refreshData() {
  if (isFetching) return;
  isFetching = true;
  try {
    const [accs, cats, txs, buds, goals, logs, recs, insts] = await Promise.all([
      getAccounts(),
      getCategories(),
      getTransactions(),
      getBudgets(),
      getSavingsGoals(),
      getSavingsLogs(),
      getRecurringTransactions(),
      getInstallments(),
    ]);
    globalState = {
      ...globalState,
      accounts: accs,
      categories: cats,
      transactions: txs,
      budgets: buds,
      savingsGoals: goals,
      savingsLogs: logs,
      recurringTransactions: recs,
      installments: insts,
    };
    emitChange();
  } catch (error) {
    console.error('Failed to fetch data from SQLite:', error);
  } finally {
    isFetching = false;
  }
}

// Auto-initialize DB once on import
initializeDatabase()
  .then(() => {
    globalState = { ...globalState, isInitialized: true };
    emitChange();
    refreshData();
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    globalState = { ...globalState, isInitialized: true };
    emitChange();
  });

export function useBudgetStore() {
  const state = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => globalState
  );

  const calculateSummary = useCallback((period: string = getCurrentPeriod()): FinancialSummary => {
    const totalBalance = state.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const monthTransactions = state.transactions.filter((t) => t.date.startsWith(period));

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
        const cat = state.categories.find((c) => c.id === catId);
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
  }, [state.accounts, state.transactions, state.categories]);

  const getCategorySpending = useCallback((categoryId: string, period: string = getCurrentPeriod()): number => {
    return state.transactions
      .filter((t) => t.categoryId === categoryId && t.type === 'expense' && t.date.startsWith(period))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const addAccount = async (account: Omit<Account, 'id' | 'createdAt'>) => {
    const id = generateId();
    await executeUpdate(
      `INSERT INTO accounts (id, name, type, balance, icon, color, isDefault, accountNumber, createdAt) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id, account.name, account.type, account.balance, account.icon, account.color, account.isDefault ? 1 : 0,
        account.accountNumber || null, new Date().toISOString()
      ]
    );
    await refreshData();
    return id;
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'createdAt');
    if (fields.length > 0) {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => (updates as any)[f]);
      values.push(id);
      
      if ('isDefault' in updates) {
        const idx = fields.indexOf('isDefault');
        values[idx] = updates.isDefault ? 1 : 0;
      }
      await executeUpdate(`UPDATE accounts SET ${setClause} WHERE id = $${values.length}`, values);
      await refreshData();
    }
  };

  const deleteAccount = async (id: string) => {
    const count = state.transactions.filter(t => t.accountId === id || t.toAccountId === id).length;
    if (count > 0) {
      throw new Error(`Tidak bisa menghapus akun karena memiliki ${count} riwayat transaksi.`);
    }
    await executeUpdate(`DELETE FROM accounts WHERE id = $1`, [id]);
    await refreshData();
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const id = generateId();
    await executeUpdate(
      `INSERT INTO categories (id, name, type, icon, color, parentId, isDefault) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, category.name, category.type, category.icon, category.color, category.parentId || null, category.isDefault ? 1 : 0]
    );
    await refreshData();
    return id;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length > 0) {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => (updates as any)[f]);
      values.push(id);
      if ('isDefault' in updates) {
        const idx = fields.indexOf('isDefault');
        values[idx] = updates.isDefault ? 1 : 0;
      }
      await executeUpdate(`UPDATE categories SET ${setClause} WHERE id = $${values.length}`, values);
      await refreshData();
    }
  };

  const deleteCategory = async (id: string) => {
    const count = state.transactions.filter(t => t.categoryId === id).length;
    if (count > 0) {
      throw new Error(`Kategori tidak dapat dihapus karena telah digunakan pada ${count} transaksi.`);
    }
    await executeUpdate(`DELETE FROM categories WHERE id = $1`, [id]);
    await refreshData();
  };

  const setBudget = async (categoryId: string, amountLimit: number, period: string = getCurrentPeriod()) => {
    const existing = state.budgets.find(b => b.categoryId === categoryId && b.period === period);
    if (existing) {
      await executeUpdate(`UPDATE budgets SET amountLimit = $1 WHERE id = $2`, [amountLimit, existing.id]);
    } else {
      await executeUpdate(
        `INSERT INTO budgets (id, categoryId, amountLimit, period, alertThreshold, createdAt) VALUES ($1, $2, $3, $4, $5, $6)`,
        [generateId(), categoryId, amountLimit, period, null, new Date().toISOString()]
      );
    }
    await refreshData();
  };

  const deleteBudget = async (id: string) => {
    await executeUpdate(`DELETE FROM budgets WHERE id = $1`, [id]);
    await refreshData();
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'isCompleted' | 'createdAt'>) => {
    const id = generateId();
    await executeUpdate(
      `INSERT INTO savingsGoals (id, name, targetAmount, currentAmount, targetDate, icon, color, isCompleted, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, goal.name, goal.targetAmount, 0, goal.targetDate || null, goal.icon || null, goal.color || null, 0, new Date().toISOString()]
    );
    await refreshData();
    return id;
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'createdAt');
    if (fields.length > 0) {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => (updates as any)[f]);
      values.push(id);
      if ('isCompleted' in updates) {
        const idx = fields.indexOf('isCompleted');
        values[idx] = updates.isCompleted ? 1 : 0;
      }
      await executeUpdate(`UPDATE savingsGoals SET ${setClause} WHERE id = $${values.length}`, values);
      await refreshData();
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    await executeUpdate(`DELETE FROM savingsGoals WHERE id = $1`, [id]);
    await executeUpdate(`DELETE FROM savingsLogs WHERE goalId = $1`, [id]);
    await refreshData();
  };

  const addRecurring = async (rec: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
    const id = generateId();
    await executeUpdate(
      `INSERT INTO recurringTransactions (id, title, amount, type, categoryId, accountId, toAccountId, frequency, dayOfMonth, nextDueDate, notes, isActive, autoCreate, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, rec.title, rec.amount, rec.type, rec.categoryId, rec.accountId, rec.toAccountId || null, rec.frequency, rec.dayOfMonth || null, rec.nextDueDate || null, rec.notes || null, rec.isActive ? 1 : 0, rec.autoCreate ? 1 : 0, new Date().toISOString()]
    );
    await refreshData();
    return id;
  };

  const toggleRecurringActive = async (id: string, isActive: boolean) => {
    await executeUpdate(`UPDATE recurringTransactions SET isActive = $1 WHERE id = $2`, [isActive ? 1 : 0, id]);
    await refreshData();
  };

  const updateRecurring = async (id: string, updates: Partial<RecurringTransaction>) => {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'createdAt');
    if (fields.length > 0) {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => (updates as any)[f]);
      values.push(id);
      if ('isActive' in updates) {
        const idx = fields.indexOf('isActive');
        values[idx] = updates.isActive ? 1 : 0;
      }
      await executeUpdate(`UPDATE recurringTransactions SET ${setClause} WHERE id = $${values.length}`, values);
      await refreshData();
    }
  };

  const deleteRecurring = async (id: string) => {
    await executeUpdate(`DELETE FROM recurringTransactions WHERE id = $1`, [id]);
    await refreshData();
  };

  const addInstallment = async (installment: Omit<Installment, 'id' | 'createdAt'>) => {
    const id = generateId();
    await executeUpdate(
      `INSERT INTO installments (id, type, title, totalAmount, monthlyAmount, totalTenorMonths, currentInstallment, dueDayOfMonth, nextDueDate, accountId, notes, isCompleted, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [id, installment.type, installment.title, installment.totalAmount || null, installment.monthlyAmount, installment.totalTenorMonths, installment.currentInstallment, installment.dueDayOfMonth, installment.nextDueDate || null, installment.accountId, installment.notes || null, installment.isCompleted ? 1 : 0, new Date().toISOString()]
    );
    await refreshData();
    return id;
  };

  const updateInstallment = async (id: string, updates: Partial<Installment>) => {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'createdAt');
    if (fields.length > 0) {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => (updates as any)[f]);
      values.push(id);
      if ('isCompleted' in updates) {
        const idx = fields.indexOf('isCompleted');
        values[idx] = updates.isCompleted ? 1 : 0;
      }
      await executeUpdate(`UPDATE installments SET ${setClause} WHERE id = $${values.length}`, values);
      await refreshData();
    }
  };

  const deleteInstallment = async (id: string) => {
    await executeUpdate(`DELETE FROM installments WHERE id = $1`, [id]);
    await refreshData();
  };

  const createTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const id = await dbCreateTransaction(tx);
    await refreshData();
    return id;
  };

  const deleteTransaction = async (id: string) => {
    await dbDeleteTransaction(id);
    await refreshData();
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await dbUpdateTransaction(id, updates);
    await refreshData();
  };

  const depositSavingsGoal = async (goalId: string, accountId: string, amount: number, date: string, notes?: string) => {
    await dbDepositSavingsGoal(goalId, accountId, amount, date, notes);
    await refreshData();
  };

  const withdrawSavingsGoal = async (goalId: string, accountId: string, amount: number, date: string, notes?: string) => {
    await dbWithdrawSavingsGoal(goalId, accountId, amount, date, notes);
    await refreshData();
  };

  const payInstallment = async (installmentId: string, date: string) => {
    await dbPayInstallment(installmentId, date);
    await refreshData();
  };

  const resetAllDataToDefault = async () => {
    await dbResetAll();
    await refreshData();
  };

  const importDatabaseBackup = async (jsonData: string) => {
    await dbImportBackup(jsonData);
    await refreshData();
  };

  return {
    ...state,
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
    addInstallment,
    updateInstallment,
    deleteInstallment,
    payInstallment,
    resetAllDataToDefault,
    exportDatabaseBackup,
    importDatabaseBackup,
  };
}
