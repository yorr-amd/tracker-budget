import Database from '@tauri-apps/plugin-sql';
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
import { generateId } from '../utils';

let dbInstance: Database | null = null;

// Helper to get or initialize the DB connection
export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:tracker_budget.db');
  }
  return dbInstance;
}

// Inisialisasi Database dengan Skema dan Data Bawaan
export async function initializeDatabase() {
  const db = await getDb();
  
  // Create Tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      icon TEXT,
      color TEXT,
      isDefault INTEGER DEFAULT 0,
      accountNumber TEXT,
      createdAt TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      parentId TEXT,
      isDefault INTEGER DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      toAccountId TEXT,
      categoryId TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      isRecurring INTEGER DEFAULT 0,
      goalId TEXT,
      adminFee REAL DEFAULT 0,
      createdAt TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL,
      amountLimit REAL NOT NULL,
      period TEXT NOT NULL,
      alertThreshold REAL,
      createdAt TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS savingsGoals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      currentAmount REAL DEFAULT 0,
      targetDate TEXT,
      icon TEXT,
      color TEXT,
      isCompleted INTEGER DEFAULT 0,
      createdAt TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS savingsLogs (
      id TEXT PRIMARY KEY,
      goalId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS recurringTransactions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      toAccountId TEXT,
      frequency TEXT NOT NULL,
      dayOfMonth INTEGER,
      nextDueDate TEXT,
      notes TEXT,
      isActive INTEGER DEFAULT 1,
      autoCreate INTEGER DEFAULT 0,
      createdAt TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS installments (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      totalAmount REAL,
      monthlyAmount REAL NOT NULL,
      totalTenorMonths INTEGER NOT NULL,
      currentInstallment INTEGER NOT NULL,
      dueDayOfMonth INTEGER NOT NULL,
      nextDueDate TEXT,
      accountId TEXT NOT NULL,
      notes TEXT,
      isCompleted INTEGER DEFAULT 0,
      createdAt TEXT
    )
  `);

  // Seed Default Accounts if empty
  const accounts: any[] = await db.select('SELECT count(*) as count FROM accounts');
  if (accounts[0].count === 0) {
    for (const acc of DEFAULT_ACCOUNTS) {
      await db.execute(
        `INSERT INTO accounts (id, name, type, balance, icon, color, isDefault, accountNumber, createdAt) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          acc.id, acc.name, acc.type, acc.balance, acc.icon, acc.color, acc.isDefault ? 1 : 0, 
          acc.accountNumber || null,  new Date().toISOString()
        ]
      );
    }
  }

  // Seed Default Categories if empty
  const categories: any[] = await db.select('SELECT count(*) as count FROM categories');
  if (categories[0].count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.execute(
        `INSERT INTO categories (id, name, type, icon, color, parentId, isDefault) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          cat.id, cat.name, cat.type, cat.icon, cat.color, cat.parentId || null, cat.isDefault ? 1 : 0
        ]
      );
    }
  }
}

// Map helper to convert boolean INT back to boolean
const mapBoolean = (val: any) => val === 1 || val === true;

// Basic Read Operations
export async function getAccounts(): Promise<Account[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM accounts');
  return rows.map(r => ({ ...r, isDefault: mapBoolean(r.isDefault) }));
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM categories');
  return rows.map(r => ({ ...r, isDefault: mapBoolean(r.isDefault) }));
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC');
  return rows.map(r => ({ ...r, isRecurring: mapBoolean(r.isRecurring) }));
}

export async function getBudgets(): Promise<Budget[]> {
  const db = await getDb();
  return await db.select<Budget[]>('SELECT * FROM budgets');
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM savingsGoals');
  return rows.map(r => ({ ...r, isCompleted: mapBoolean(r.isCompleted) }));
}

export async function getSavingsLogs(): Promise<SavingsLog[]> {
  const db = await getDb();
  return await db.select<SavingsLog[]>('SELECT * FROM savingsLogs');
}

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM recurringTransactions');
  return rows.map(r => ({ ...r, isActive: mapBoolean(r.isActive) }));
}

export async function getInstallments(): Promise<Installment[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM installments');
  return rows.map(r => ({ ...r, isCompleted: mapBoolean(r.isCompleted) }));
}

export async function executeUpdate<T>(query: string, params: any[]): Promise<void> {
    const db = await getDb();
    await db.execute(query, params);
}

// Operasi Transaksi Atomik dengan Pembaruan Saldo
export async function createTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
  const db = await getDb();
  const id = generateId();
  const createdAt = new Date().toISOString();
  
  await db.execute('BEGIN TRANSACTION');
  try {
    const accRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [tx.accountId]);
    if (accRows.length === 0) throw new Error('Account not found');
    let balance = accRows[0].balance;

    if (tx.type === 'expense') {
      balance -= tx.amount;
    } else if (tx.type === 'income') {
      balance += tx.amount;
    } else if (tx.type === 'transfer') {
      const totalDeduction = tx.amount + (tx.adminFee || 0);
      balance -= totalDeduction;
      
      if (tx.toAccountId) {
        const destRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [tx.toAccountId]);
        if (destRows.length > 0) {
          await db.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [destRows[0].balance + tx.amount, tx.toAccountId]);
        }
      }
    }
    
    await db.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [balance, tx.accountId]);
    
    await db.execute(`
      INSERT INTO transactions (id, accountId, toAccountId, categoryId, amount, type, date, notes, isRecurring, goalId, adminFee, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      id, tx.accountId, tx.toAccountId || null, tx.categoryId, tx.amount, tx.type, tx.date, tx.notes || null,
      tx.isRecurring ? 1 : 0, tx.goalId || null, tx.adminFee || 0, createdAt
    ]);

    await db.execute('COMMIT');
    return id;
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    const txRows = await db.select<any[]>('SELECT * FROM transactions WHERE id = $1', [id]);
    if (txRows.length === 0) {
      await db.execute('ROLLBACK');
      return;
    }
    const tx = txRows[0];

    const accRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [tx.accountId]);
    if (accRows.length > 0) {
      let balance = accRows[0].balance;
      if (tx.type === 'expense') {
        balance += tx.amount;
      } else if (tx.type === 'income') {
        balance -= tx.amount;
      } else if (tx.type === 'transfer') {
        const totalDeduction = tx.amount + (tx.adminFee || 0);
        balance += totalDeduction;
        
        if (tx.toAccountId) {
          const destRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [tx.toAccountId]);
          if (destRows.length > 0) {
            await db.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [destRows[0].balance - tx.amount, tx.toAccountId]);
          }
        }
      }
      await db.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [balance, tx.accountId]);
    }

    // Rollback savings goal if linked
    if (tx.goalId) {
      const goalRows = await db.select<any[]>('SELECT currentAmount, targetAmount FROM savingsGoals WHERE id = $1', [tx.goalId]);
      if (goalRows.length > 0) {
        const goal = goalRows[0];
        let newCurrent = goal.currentAmount;
        if (tx.type === 'expense') {
          newCurrent = Math.max(0, goal.currentAmount - tx.amount);
        } else if (tx.type === 'income') {
          newCurrent = goal.currentAmount + tx.amount;
        }
        await db.execute('UPDATE savingsGoals SET currentAmount = $1, isCompleted = $2 WHERE id = $3', 
          [newCurrent, newCurrent >= goal.targetAmount ? 1 : 0, tx.goalId]);
      }
      
      const logRows = await db.select<any[]>('SELECT id, amount, accountId FROM savingsLogs WHERE goalId = $1 ORDER BY createdAt DESC', [tx.goalId]);
      const targetAmountToMatch = tx.type === 'expense' ? tx.amount : -tx.amount;
      const matchedLog = logRows.find(l => l.amount === targetAmountToMatch && l.accountId === tx.accountId);
      if (matchedLog) {
        await db.execute('DELETE FROM savingsLogs WHERE id = $1', [matchedLog.id]);
      }
    }

    await db.execute('DELETE FROM transactions WHERE id = $1', [id]);
    await db.execute('COMMIT');
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    const txRows = await db.select<any[]>('SELECT * FROM transactions WHERE id = $1', [id]);
    if (txRows.length === 0) {
      await db.execute('ROLLBACK');
      return;
    }
    
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'createdAt');
    if (fields.length > 0) {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => (updates as any)[f]);
      values.push(id);
      
      // Map boolean
      if ('isRecurring' in updates) {
        const idx = fields.indexOf('isRecurring');
        values[idx] = updates.isRecurring ? 1 : 0;
      }

      await db.execute(`UPDATE transactions SET ${setClause} WHERE id = $${values.length}`, values);
    }
    
    await db.execute('COMMIT');
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
}

export async function depositSavingsGoal(goalId: string, accountId: string, amount: number, date: string, notes?: string) {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    const goalRows = await db.select<any[]>('SELECT currentAmount, targetAmount FROM savingsGoals WHERE id = $1', [goalId]);
    if (goalRows.length === 0) throw new Error('Goal not found');
    const goal = goalRows[0];
    
    const accRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [accountId]);
    if (accRows.length === 0) throw new Error('Account not found');
    
    // Create transaction (expense from account)
    const txId = generateId();
    await db.execute(`
      INSERT INTO transactions (id, accountId, categoryId, amount, type, date, notes, goalId, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [txId, accountId, 'cat_savings', amount, 'expense', date, notes || 'Setoran Tabungan', goalId, new Date().toISOString()]);

    // Deduct account balance
    await db.execute('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, accountId]);

    // Update goal
    const newCurrent = goal.currentAmount + amount;
    await db.execute('UPDATE savingsGoals SET currentAmount = $1, isCompleted = $2 WHERE id = $3', 
      [newCurrent, newCurrent >= goal.targetAmount ? 1 : 0, goalId]);

    // Add log
    await db.execute(`
      INSERT INTO savingsLogs (id, goalId, accountId, amount, date, notes, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [generateId(), goalId, accountId, amount, date, notes || null, new Date().toISOString()]);

    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

export async function withdrawSavingsGoal(goalId: string, accountId: string, amount: number, date: string, notes?: string) {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    const goalRows = await db.select<any[]>('SELECT currentAmount, targetAmount FROM savingsGoals WHERE id = $1', [goalId]);
    if (goalRows.length === 0) throw new Error('Goal not found');
    const goal = goalRows[0];
    
    // Create transaction (income to account)
    const txId = generateId();
    await db.execute(`
      INSERT INTO transactions (id, accountId, categoryId, amount, type, date, notes, goalId, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [txId, accountId, 'cat_savings', amount, 'income', date, notes || 'Pencairan Tabungan', goalId, new Date().toISOString()]);

    // Add account balance
    await db.execute('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, accountId]);

    // Update goal
    const newCurrent = Math.max(0, goal.currentAmount - amount);
    await db.execute('UPDATE savingsGoals SET currentAmount = $1, isCompleted = $2 WHERE id = $3', 
      [newCurrent, newCurrent >= goal.targetAmount ? 1 : 0, goalId]);

    // Add log
    await db.execute(`
      INSERT INTO savingsLogs (id, goalId, accountId, amount, date, notes, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [generateId(), goalId, accountId, -amount, date, notes || null, new Date().toISOString()]);

    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

export async function payInstallment(installmentId: string, date: string) {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    const instRows = await db.select<any[]>('SELECT * FROM installments WHERE id = $1', [installmentId]);
    if (instRows.length === 0) throw new Error('Installment not found');
    const inst = instRows[0];
    
    if (inst.isCompleted || inst.currentInstallment >= inst.totalTenorMonths) {
      await db.execute('ROLLBACK');
      throw new Error('Cicilan sudah lunas');
    }
    
    // Create transaction
    const txId = generateId();
    await db.execute(`
      INSERT INTO transactions (id, accountId, categoryId, amount, type, date, notes, installmentId, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [txId, inst.accountId, 'cat_installments', inst.monthlyAmount, 'expense', date, `Pembayaran ${inst.title} (Ke-${inst.currentInstallment + 1}/${inst.totalTenorMonths})`, installmentId, new Date().toISOString()]);
    
    // Deduct account balance
    await db.execute('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [inst.monthlyAmount, inst.accountId]);
    
    // Update installment
    const newCurrentInstall = inst.currentInstallment + 1;
    let nextDueDate = inst.nextDueDate;
    if (newCurrentInstall < inst.totalTenorMonths && nextDueDate) {
      const d = new Date(nextDueDate);
      d.setMonth(d.getMonth() + 1);
      nextDueDate = d.toISOString().split('T')[0];
    } else {
      nextDueDate = null;
    }
    
    await db.execute('UPDATE installments SET currentInstallment = $1, nextDueDate = $2, isCompleted = $3 WHERE id = $4', 
      [newCurrentInstall, nextDueDate, newCurrentInstall >= inst.totalTenorMonths ? 1 : 0, installmentId]);

    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

export async function resetAllDataToDefault() {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    await db.execute('DELETE FROM transactions');
    await db.execute('DELETE FROM budgets');
    await db.execute('DELETE FROM savingsGoals');
    await db.execute('DELETE FROM savingsLogs');
    await db.execute('DELETE FROM recurringTransactions');
    await db.execute('DELETE FROM installments');
    await db.execute('DELETE FROM accounts');
    await db.execute('DELETE FROM categories');
    await db.execute('COMMIT');
    
    // Re-initialize
    await initializeDatabase();
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

export async function exportDatabaseBackup(): Promise<string> {
  const accounts = await getAccounts();
  const categories = await getCategories();
  const transactions = await getTransactions();
  const budgets = await getBudgets();
  const savingsGoals = await getSavingsGoals();
  const savingsLogs = await getSavingsLogs();
  const recurringTransactions = await getRecurringTransactions();
  const installments = await getInstallments();
  
  const backup = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: {
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      savingsLogs,
      recurringTransactions,
      installments
    }
  };
  return JSON.stringify(backup, null, 2);
}

export async function importDatabaseBackup(jsonData: string): Promise<void> {
  try {
    const backup = JSON.parse(jsonData);
    if (!backup.data || !backup.data.accounts) throw new Error('Format JSON tidak valid');
    
    await resetAllDataToDefault(); // Clean current
    const db = await getDb();
    
    await db.execute('BEGIN TRANSACTION');
    try {
      // Clear auto-seeded data
      await db.execute('DELETE FROM accounts');
      await db.execute('DELETE FROM categories');
      
      for (const a of backup.data.accounts) {
        await db.execute(`INSERT INTO accounts (id, name, type, balance, icon, color, isDefault, accountNumber, createdAt) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, 
          [a.id, a.name, a.type, a.balance, a.icon, a.color, a.isDefault ? 1 : 0, a.accountNumber || null,  a.createdAt || new Date().toISOString()]);
      }
      
      for (const c of backup.data.categories) {
        await db.execute(`INSERT INTO categories (id, name, type, icon, color, parentId, isDefault) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
          [c.id, c.name, c.type, c.icon, c.color, c.parentId || null, c.isDefault ? 1 : 0]);
      }
      
      if (backup.data.transactions) {
        for (const t of backup.data.transactions) {
          await db.execute(`INSERT INTO transactions (id, accountId, toAccountId, categoryId, amount, type, date, notes, isRecurring, goalId, adminFee, createdAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, 
            [t.id, t.accountId, t.toAccountId || null, t.categoryId, t.amount, t.type, t.date, t.notes || null, t.isRecurring ? 1 : 0, t.goalId || null, t.adminFee || 0, t.createdAt || new Date().toISOString()]);
        }
      }
      
      if (backup.data.budgets) {
        for (const b of backup.data.budgets) {
          await db.execute(`INSERT INTO budgets (id, categoryId, amountLimit, period, alertThreshold, createdAt)
            VALUES ($1, $2, $3, $4, $5, $6)`, 
            [b.id, b.categoryId, b.amountLimit, b.period, b.alertThreshold || null, b.createdAt || new Date().toISOString()]);
        }
      }
      
      if (backup.data.savingsGoals) {
        for (const s of backup.data.savingsGoals) {
          await db.execute(`INSERT INTO savingsGoals (id, name, targetAmount, currentAmount, targetDate, icon, color, isCompleted, createdAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, 
            [s.id, s.name, s.targetAmount, s.currentAmount, s.targetDate || null, s.icon || null, s.color || null, s.isCompleted ? 1 : 0, s.createdAt || new Date().toISOString()]);
        }
      }
      
      if (backup.data.savingsLogs) {
        for (const l of backup.data.savingsLogs) {
          await db.execute(`INSERT INTO savingsLogs (id, goalId, accountId, amount, date, notes, createdAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
            [l.id, l.goalId, l.accountId, l.amount, l.date, l.notes || null, l.createdAt || new Date().toISOString()]);
        }
      }
      
      if (backup.data.recurringTransactions) {
        for (const r of backup.data.recurringTransactions) {
          await db.execute(`INSERT INTO recurringTransactions (id, title, amount, type, categoryId, accountId, toAccountId, frequency, dayOfMonth, nextDueDate, notes, isActive, autoCreate, createdAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, 
            [r.id, r.title, r.amount, r.type, r.categoryId, r.accountId, r.toAccountId || null, r.frequency, r.dayOfMonth || null, r.nextDueDate || null, r.notes || null, r.isActive ? 1 : 0, r.autoCreate ? 1 : 0, r.createdAt || new Date().toISOString()]);
        }
      }
      
      if (backup.data.installments) {
        for (const i of backup.data.installments) {
          await db.execute(`INSERT INTO installments (id, type, title, totalAmount, monthlyAmount, totalTenorMonths, currentInstallment, dueDayOfMonth, nextDueDate, accountId, notes, isCompleted, createdAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`, 
            [i.id, i.type, i.title, i.totalAmount || null, i.monthlyAmount, i.totalTenorMonths, i.currentInstallment, i.dueDayOfMonth, i.nextDueDate || null, i.accountId, i.notes || null, i.isCompleted ? 1 : 0, i.createdAt || new Date().toISOString()]);
        }
      }

      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
  } catch (error) {
    throw new Error('Gagal mengimpor data. Pastikan file JSON valid.');
  }
}
