import Dexie, { type Table } from 'dexie';
import {
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  SavingsLog,
  RecurringTransaction,
  Installment,
} from '@/types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '../constants/defaults';
import { generateId, getTodayDateString, calculateNextDueDate } from '../utils';

export class BudgetDatabase extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  savingsLogs!: Table<SavingsLog, string>;
  recurringTransactions!: Table<RecurringTransaction, string>;
  installments!: Table<Installment, string>;

  constructor() {
    super('TrackerBudgetTauriDB');
    this.version(1).stores({
      accounts: 'id, name, type, isDefault',
      categories: 'id, name, type, parentId',
      transactions: 'id, accountId, toAccountId, categoryId, type, date, isRecurring',
      budgets: 'id, categoryId, period',
      savingsGoals: 'id, isCompleted',
      savingsLogs: 'id, goalId, accountId, date',
      recurringTransactions: 'id, isActive, nextDueDate',
      installments: 'id, type, isCompleted, nextDueDate',
    });
  }
}

export const db = new BudgetDatabase();

// Inisialisasi Database dengan Data Bawaan jika masih kosong
export async function initializeDatabase() {
  const accountCount = await db.accounts.count();
  if (accountCount === 0) {
    await db.accounts.bulkAdd(DEFAULT_ACCOUNTS);
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }

}

// Operasi Transaksi Atomik dengan Pembaruan Saldo Otomatis
export async function createTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
  return await db.transaction('rw', [db.transactions, db.accounts], async () => {
    const id = generateId();
    const newTx: Transaction = {
      ...tx,
      id,
      createdAt: new Date().toISOString(),
    };

    // Update Saldo Akun Sumber
    const sourceAccount = await db.accounts.get(tx.accountId);
    if (sourceAccount) {
      let newBalance = sourceAccount.balance;
      if (tx.type === 'expense') {
        newBalance -= tx.amount;
      } else if (tx.type === 'income') {
        newBalance += tx.amount;
      } else if (tx.type === 'transfer') {
        const totalDeduction = tx.amount + (tx.adminFee || 0);
        newBalance -= totalDeduction;

        // Update Saldo Akun Tujuan jika transfer
        if (tx.toAccountId) {
          const destAccount = await db.accounts.get(tx.toAccountId);
          if (destAccount) {
            await db.accounts.update(tx.toAccountId, {
              balance: destAccount.balance + tx.amount,
            });
          }
        }
      }
      await db.accounts.update(tx.accountId, { balance: newBalance });
    }

    await db.transactions.add(newTx);
    return id;
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transaction('rw', [db.transactions, db.accounts, db.savingsGoals, db.savingsLogs], async () => {
    const tx = await db.transactions.get(id);
    if (!tx) return;

    // Rollback Saldo Akun
    const sourceAccount = await db.accounts.get(tx.accountId);
    if (sourceAccount) {
      let newBalance = sourceAccount.balance;
      if (tx.type === 'expense') {
        newBalance += tx.amount;
      } else if (tx.type === 'income') {
        newBalance -= tx.amount;
      } else if (tx.type === 'transfer') {
        const totalDeduction = tx.amount + (tx.adminFee || 0);
        newBalance += totalDeduction;

        if (tx.toAccountId) {
          const destAccount = await db.accounts.get(tx.toAccountId);
          if (destAccount) {
            await db.accounts.update(tx.toAccountId, {
              balance: destAccount.balance - tx.amount,
            });
          }
        }
      }
      await db.accounts.update(tx.accountId, { balance: newBalance });
    }

    // Rollback saldo Celengan/Tabungan jika transaksi terhubung dengan target tabungan
    if (tx.goalId) {
      const goal = await db.savingsGoals.get(tx.goalId);
      if (goal) {
        let newCurrent = goal.currentAmount;
        if (tx.type === 'expense') {
          // Menghapus transaksi setoran -> kurangi saldo tabungan
          newCurrent = Math.max(0, goal.currentAmount - tx.amount);
        } else if (tx.type === 'income') {
          // Menghapus transaksi pencairan -> kembalikan saldo tabungan
          newCurrent = goal.currentAmount + tx.amount;
        }
        await db.savingsGoals.update(goal.id, {
          currentAmount: newCurrent,
          isCompleted: newCurrent >= goal.targetAmount,
        });
      }

      // Bersihkan log mutasi tabungan yang berkesesuaian
      const logs = await db.savingsLogs.where('goalId').equals(tx.goalId).toArray();
      const targetAmountToMatch = tx.type === 'expense' ? tx.amount : -tx.amount;
      const matchedLog = logs.reverse().find(
        (l) => l.amount === targetAmountToMatch && l.accountId === tx.accountId
      );
      if (matchedLog) {
        await db.savingsLogs.delete(matchedLog.id);
      }
    }

    await db.transactions.delete(id);
  });
}

export async function updateTransaction(id: string, updatedData: Partial<Transaction>): Promise<void> {
  await db.transaction('rw', [db.transactions, db.accounts], async () => {
    const oldTx = await db.transactions.get(id);
    if (!oldTx) return;

    // 1. Rollback oldTx
    const sourceAccount = await db.accounts.get(oldTx.accountId);
    if (sourceAccount) {
      let rollBalance = sourceAccount.balance;
      if (oldTx.type === 'expense') rollBalance += oldTx.amount;
      else if (oldTx.type === 'income') rollBalance -= oldTx.amount;
      else if (oldTx.type === 'transfer') {
        rollBalance += oldTx.amount + (oldTx.adminFee || 0);
        if (oldTx.toAccountId) {
          const destAccount = await db.accounts.get(oldTx.toAccountId);
          if (destAccount) {
            await db.accounts.update(oldTx.toAccountId, { balance: destAccount.balance - oldTx.amount });
          }
        }
      }
      await db.accounts.update(oldTx.accountId, { balance: rollBalance });
    }

    // 2. Apply new merged transaction
    const newTx: Transaction = {
      ...oldTx,
      ...updatedData,
    };

    const newSourceAccount = await db.accounts.get(newTx.accountId);
    if (newSourceAccount) {
      let applyBalance = newSourceAccount.balance;
      if (newTx.type === 'expense') applyBalance -= newTx.amount;
      else if (newTx.type === 'income') applyBalance += newTx.amount;
      else if (newTx.type === 'transfer') {
        applyBalance -= (newTx.amount + (newTx.adminFee || 0));
        if (newTx.toAccountId) {
          const destAccount = await db.accounts.get(newTx.toAccountId);
          if (destAccount) {
            await db.accounts.update(newTx.toAccountId, { balance: destAccount.balance + newTx.amount });
          }
        }
      }
      await db.accounts.update(newTx.accountId, { balance: applyBalance });
    }

    await db.transactions.put(newTx);
  });
}

// Tambah Setoran ke Target Tabungan
export async function depositSavingsGoal(goalId: string, accountId: string, amount: number, notes?: string) {
  return await db.transaction('rw', [db.savingsGoals, db.savingsLogs, db.accounts, db.transactions], async () => {
    const goal = await db.savingsGoals.get(goalId);
    const account = await db.accounts.get(accountId);
    if (!goal || !account) return;

    // Kurangi saldo akun
    await db.accounts.update(accountId, { balance: account.balance - amount });

    // Tambah tabungan goal
    const newCurrent = goal.currentAmount + amount;
    await db.savingsGoals.update(goalId, {
      currentAmount: newCurrent,
      isCompleted: newCurrent >= goal.targetAmount,
    });

    // Catat log tabungan
    const logId = generateId();
    await db.savingsLogs.add({
      id: logId,
      goalId,
      accountId,
      amount,
      date: getTodayDateString(),
      notes: notes || `Setoran tabungan: ${goal.name}`,
      createdAt: new Date().toISOString(),
    });

    // Buat transaksi expense khusus tabungan agar terlihat di riwayat
    await db.transactions.add({
      id: generateId(),
      accountId,
      categoryId: 'cat_other_expense',
      type: 'expense',
      amount,
      date: getTodayDateString(),
      notes: notes || `Alokasi Tabungan: ${goal.name}`,
      goalId,
      createdAt: new Date().toISOString(),
    });
  });
}

// Tarik / Cairkan Dana dari Target Tabungan ke Dompet
export async function withdrawSavingsGoal(goalId: string, accountId: string, amount: number, notes?: string) {
  return await db.transaction('rw', [db.savingsGoals, db.savingsLogs, db.accounts, db.transactions], async () => {
    const goal = await db.savingsGoals.get(goalId);
    const account = await db.accounts.get(accountId);
    if (!goal || !account) throw new Error('Target tabungan atau akun tidak ditemukan');

    if (amount <= 0) {
      throw new Error('Nominal pencairan harus lebih dari Rp 0');
    }

    if (goal.currentAmount < amount) {
      throw new Error(`Saldo tabungan tidak mencukupi (Tersedia: Rp ${goal.currentAmount.toLocaleString('id-ID')})`);
    }

    // Tambah saldo akun penerima
    await db.accounts.update(accountId, { balance: account.balance + amount });

    // Kurangi saldo tabungan goal
    const newCurrent = Math.max(0, goal.currentAmount - amount);
    await db.savingsGoals.update(goalId, {
      currentAmount: newCurrent,
      isCompleted: newCurrent >= goal.targetAmount,
    });

    // Catat log tabungan (nilai negatif menandakan penarikan)
    const logId = generateId();
    await db.savingsLogs.add({
      id: logId,
      goalId,
      accountId,
      amount: -amount,
      date: getTodayDateString(),
      notes: notes || `Pencairan tabungan: ${goal.name}`,
      createdAt: new Date().toISOString(),
    });

    // Buat transaksi income khusus pencairan tabungan
    await db.transactions.add({
      id: generateId(),
      accountId,
      categoryId: 'cat_other_income',
      type: 'income',
      amount,
      date: getTodayDateString(),
      notes: notes || `Pencairan Tabungan: ${goal.name}`,
      goalId,
      createdAt: new Date().toISOString(),
    });
  });
}

// Operasi Pembayaran Cicilan (SPayLater & SPinjam)
export async function payInstallment(installmentId: string): Promise<void> {
  return await db.transaction('rw', [db.installments, db.transactions, db.accounts], async () => {
    const inst = await db.installments.get(installmentId);
    if (!inst) throw new Error('Data cicilan tidak ditemukan');
    if (inst.isCompleted) throw new Error('Cicilan ini sudah lunas');

    const account = await db.accounts.get(inst.accountId);
    if (!account) throw new Error('Akun pembayaran tidak ditemukan');

    const isSpaylater = inst.type === 'spaylater';
    const categoryId = isSpaylater ? 'cat_spaylater' : 'cat_spinjam';
    const typeLabel = isSpaylater ? 'SPayLater' : 'SPinjam';
    const notes = `Cicilan ${typeLabel} (${inst.currentInstallment}/${inst.totalTenorMonths}): ${inst.title}`;

    // 1. Catat transaksi pengeluaran
    const txId = generateId();
    await db.transactions.add({
      id: txId,
      accountId: inst.accountId,
      categoryId,
      type: 'expense',
      amount: inst.monthlyAmount,
      date: getTodayDateString(),
      notes,
      createdAt: new Date().toISOString(),
    });

    // 2. Kurangi saldo akun
    await db.accounts.update(inst.accountId, {
      balance: account.balance - inst.monthlyAmount,
    });

    // 3. Update progres cicilan
    const nextInstallmentNum = inst.currentInstallment + 1;
    const isCompleted = nextInstallmentNum > inst.totalTenorMonths;
    const nextDue = calculateNextDueDate(inst.nextDueDate, 'monthly', inst.dueDayOfMonth);

    await db.installments.update(inst.id, {
      currentInstallment: isCompleted ? inst.totalTenorMonths : nextInstallmentNum,
      isCompleted,
      nextDueDate: nextDue,
    });
  });
}

// Reset Database ke Default
export async function resetAllDataToDefault() {
  await db.transaction('rw', [
    db.accounts,
    db.categories,
    db.transactions,
    db.budgets,
    db.savingsGoals,
    db.savingsLogs,
    db.recurringTransactions,
    db.installments,
  ], async () => {
    await db.accounts.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.budgets.clear();
    await db.savingsGoals.clear();
    await db.savingsLogs.clear();
    await db.recurringTransactions.clear();
    await db.installments.clear();

    await db.accounts.bulkAdd(DEFAULT_ACCOUNTS);
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  });
}

// Ekspor & Impor Seluruh Data JSON
export async function exportDatabaseBackup() {
  const accounts = await db.accounts.toArray();
  const categories = await db.categories.toArray();
  const transactions = await db.transactions.toArray();
  const budgets = await db.budgets.toArray();
  const savingsGoals = await db.savingsGoals.toArray();
  const savingsLogs = await db.savingsLogs.toArray();
  const recurringTransactions = await db.recurringTransactions.toArray();
  const installments = await db.installments.toArray();

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    data: {
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      savingsLogs,
      recurringTransactions,
      installments,
    },
  };
}

export function validateBackupData(backupJson: any): void {
  if (!backupJson || typeof backupJson !== 'object') {
    throw new Error('File backup bukan merupakan objek JSON yang valid.');
  }
  if (!backupJson.data || typeof backupJson.data !== 'object') {
    throw new Error('Format file backup tidak valid: properti "data" tidak ditemukan.');
  }

  const { accounts, categories, transactions, budgets, savingsGoals, savingsLogs, recurringTransactions, installments } = backupJson.data;

  if (!accounts && !categories && !transactions && !budgets && !savingsGoals && !installments) {
    throw new Error('Data cadangan kosong atau tidak memiliki tabel esensial yang dikenali.');
  }

  if (accounts !== undefined) {
    if (!Array.isArray(accounts)) throw new Error('Format data "accounts" harus berupa array.');
    for (let i = 0; i < accounts.length; i++) {
      const a = accounts[i];
      if (!a || typeof a !== 'object' || !a.id || typeof a.name !== 'string' || typeof a.balance !== 'number') {
        throw new Error(`Data akun pada baris ke-${i + 1} tidak valid (membutuhkan id, name, dan balance).`);
      }
    }
  }

  if (categories !== undefined) {
    if (!Array.isArray(categories)) throw new Error('Format data "categories" harus berupa array.');
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      if (!c || typeof c !== 'object' || !c.id || typeof c.name !== 'string' || typeof c.type !== 'string') {
        throw new Error(`Data kategori pada baris ke-${i + 1} tidak valid (membutuhkan id, name, dan type).`);
      }
    }
  }

  if (transactions !== undefined) {
    if (!Array.isArray(transactions)) throw new Error('Format data "transactions" harus berupa array.');
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (!t || typeof t !== 'object' || !t.id || !t.accountId || typeof t.amount !== 'number' || typeof t.type !== 'string' || !t.date) {
        throw new Error(`Data transaksi pada baris ke-${i + 1} tidak valid.`);
      }
    }
  }

  if (budgets !== undefined) {
    if (!Array.isArray(budgets)) throw new Error('Format data "budgets" harus berupa array.');
    for (let i = 0; i < budgets.length; i++) {
      const b = budgets[i];
      if (!b || typeof b !== 'object' || !b.id || !b.categoryId || !b.period || typeof b.amountLimit !== 'number') {
        throw new Error(`Data anggaran pada baris ke-${i + 1} tidak valid.`);
      }
    }
  }

  if (savingsGoals !== undefined) {
    if (!Array.isArray(savingsGoals)) throw new Error('Format data "savingsGoals" harus berupa array.');
    for (let i = 0; i < savingsGoals.length; i++) {
      const g = savingsGoals[i];
      if (!g || typeof g !== 'object' || !g.id || typeof g.name !== 'string' || typeof g.targetAmount !== 'number' || typeof g.currentAmount !== 'number') {
        throw new Error(`Data target tabungan pada baris ke-${i + 1} tidak valid.`);
      }
    }
  }

  if (savingsLogs !== undefined) {
    if (!Array.isArray(savingsLogs)) throw new Error('Format data "savingsLogs" harus berupa array.');
    for (let i = 0; i < savingsLogs.length; i++) {
      const l = savingsLogs[i];
      if (!l || typeof l !== 'object' || !l.id || !l.goalId || !l.accountId || typeof l.amount !== 'number') {
        throw new Error(`Data riwayat tabungan pada baris ke-${i + 1} tidak valid.`);
      }
    }
  }

  if (recurringTransactions !== undefined) {
    if (!Array.isArray(recurringTransactions)) throw new Error('Format data "recurringTransactions" harus berupa array.');
    for (let i = 0; i < recurringTransactions.length; i++) {
      const r = recurringTransactions[i];
      if (!r || typeof r !== 'object' || !r.id || typeof r.title !== 'string' || typeof r.amount !== 'number' || !r.accountId) {
        throw new Error(`Data transaksi rutin pada baris ke-${i + 1} tidak valid.`);
      }
    }
  }

  if (installments !== undefined) {
    if (!Array.isArray(installments)) throw new Error('Format data "installments" harus berupa array.');
    for (let i = 0; i < installments.length; i++) {
      const ins = installments[i];
      if (!ins || typeof ins !== 'object' || !ins.id || typeof ins.title !== 'string' || typeof ins.monthlyAmount !== 'number' || !ins.accountId) {
        throw new Error(`Data cicilan pada baris ke-${i + 1} tidak valid.`);
      }
    }
  }
}

export async function importDatabaseBackup(backupJson: any) {
  // Validasi skema sebelum menyentuh database sama sekali (mencegah data wipe jika file korup)
  validateBackupData(backupJson);

  const { accounts, categories, transactions, budgets, savingsGoals, savingsLogs, recurringTransactions, installments } = backupJson.data;

  await db.transaction('rw', [
    db.accounts,
    db.categories,
    db.transactions,
    db.budgets,
    db.savingsGoals,
    db.savingsLogs,
    db.recurringTransactions,
    db.installments,
  ], async () => {
    if (accounts) {
      await db.accounts.clear();
      await db.accounts.bulkAdd(accounts);
    }
    if (categories) {
      await db.categories.clear();
      await db.categories.bulkAdd(categories);
    }
    if (transactions) {
      await db.transactions.clear();
      await db.transactions.bulkAdd(transactions);
    }
    if (budgets) {
      await db.budgets.clear();
      await db.budgets.bulkAdd(budgets);
    }
    if (savingsGoals) {
      await db.savingsGoals.clear();
      await db.savingsGoals.bulkAdd(savingsGoals);
    }
    if (savingsLogs) {
      await db.savingsLogs.clear();
      await db.savingsLogs.bulkAdd(savingsLogs);
    }
    if (recurringTransactions) {
      await db.recurringTransactions.clear();
      await db.recurringTransactions.bulkAdd(recurringTransactions);
    }
    if (installments) {
      await db.installments.clear();
      await db.installments.bulkAdd(installments);
    }
  });
}
