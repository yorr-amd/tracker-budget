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

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:tracker_budget.db');
  }
  return dbInstance;
}

export async function initializeDatabase() {
  const db = await getDb();

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

  // Transactions: 12 columns (no time/receiptUrl/tags/recurringId/installmentId in DB)
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
      notes TEXT,
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
      currentInstallment INTEGER NOT NULL DEFAULT 0,
      dueDayOfMonth INTEGER NOT NULL,
      nextDueDate TEXT,
      accountId TEXT NOT NULL,
      notes TEXT,
      isCompleted INTEGER DEFAULT 0,
      createdAt TEXT
    )
  `);

  // Seed default accounts if empty
  const accCount: any[] = await db.select('SELECT count(*) as count FROM accounts');
  if (accCount[0].count === 0) {
    for (const acc of DEFAULT_ACCOUNTS) {
      await db.execute(
        `INSERT INTO accounts (id, name, type, balance, icon, color, isDefault, accountNumber, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [acc.id, acc.name, acc.type, acc.balance, acc.icon, acc.color, acc.isDefault ? 1 : 0,
          acc.accountNumber || null, new Date().toISOString()]
      );
    }
  }

  // Seed default categories if empty
  const catCount: any[] = await db.select('SELECT count(*) as count FROM categories');
  if (catCount[0].count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.execute(
        `INSERT INTO categories (id, name, type, icon, color, parentId, isDefault)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.parentId || null, cat.isDefault ? 1 : 0]
      );
    }
  }
}

const mapBool = (val: any): boolean => val === 1 || val === true;

export async function getAccounts(): Promise<Account[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM accounts ORDER BY name');
  return rows.map(r => ({ ...r, isDefault: mapBool(r.isDefault) }));
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM categories ORDER BY name');
  return rows.map(r => ({ ...r, isDefault: mapBool(r.isDefault) }));
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC');
  return rows.map(r => ({ ...r, isRecurring: mapBool(r.isRecurring) }));
}

export async function getBudgets(): Promise<Budget[]> {
  const db = await getDb();
  return await db.select<Budget[]>('SELECT * FROM budgets');
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM savingsGoals ORDER BY createdAt DESC');
  return rows.map(r => ({ ...r, isCompleted: mapBool(r.isCompleted) }));
}

export async function getSavingsLogs(): Promise<SavingsLog[]> {
  const db = await getDb();
  return await db.select<SavingsLog[]>('SELECT * FROM savingsLogs ORDER BY date DESC');
}

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM recurringTransactions ORDER BY title');
  return rows.map(r => ({ ...r, isActive: mapBool(r.isActive), autoCreate: mapBool(r.autoCreate) }));
}

export async function getInstallments(): Promise<Installment[]> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT * FROM installments ORDER BY createdAt DESC');
  return rows.map(r => ({ ...r, isCompleted: mapBool(r.isCompleted) }));
}

export async function executeUpdate(query: string, params: any[]): Promise<void> {
  const db = await getDb();
  await db.execute(query, params);
}

// ── Atomic Transaction Operations ──────────────────────────────────────────

export async function createTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
  const db = await getDb();
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.execute('BEGIN TRANSACTION');
  try {
    const accRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [tx.accountId]);
    if (accRows.length === 0) throw new Error('Akun tidak ditemukan');
    let balance = accRows[0].balance;

    if (tx.type === 'expense') {
      balance -= tx.amount;
    } else if (tx.type === 'income') {
      balance += tx.amount;
    } else if (tx.type === 'transfer') {
      balance -= (tx.amount + (tx.adminFee || 0));
      if (tx.toAccountId) {
        const destRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [tx.toAccountId]);
        if (destRows.length > 0) {
          await db.execute('UPDATE accounts SET balance = $1 WHERE id = $2',
            [destRows[0].balance + tx.amount, tx.toAccountId]);
        }
      }
    }

    await db.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [balance, tx.accountId]);

    // 12 columns: id, accountId, toAccountId, categoryId, amount, type, date, notes, isRecurring, goalId, adminFee, createdAt
    await db.execute(
      `INSERT INTO transactions (id, accountId, toAccountId, categoryId, amount, type, date, notes, isRecurring, goalId, adminFee, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, tx.accountId, tx.toAccountId || null, tx.categoryId, tx.amount, tx.type, tx.date,
        tx.notes || null, tx.isRecurring ? 1 : 0, tx.goalId || null, tx.adminFee || 0, createdAt]
    );

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
    if (txRows.length === 0) { await db.execute('ROLLBACK'); return; }
    const tx = txRows[0];

    const accRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [tx.accountId]);
    if (accRows.length > 0) {
      let balance = accRows[0].balance;
      if (tx.type === 'expense') {
        balance += tx.amount;
      } else if (tx.type === 'income') {
        balance -= tx.amount;
      } else if (tx.type === 'transfer') {
        balance += (tx.amount + (tx.adminFee || 0));
        if (tx.toAccountId) {
          const destRows = await db.select<any[]>('SELECT balance FROM accounts WHERE id = $1', [tx.toAccountId]);
          if (destRows.length > 0) {
            await db.execute('UPDATE accounts SET balance = $1 WHERE id = $2',
              [destRows[0].balance - tx.amount, tx.toAccountId]);
          }
        }
      }
      await db.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [balance, tx.accountId]);
    }

    if (tx.goalId) {
      const goalRows = await db.select<any[]>('SELECT currentAmount, targetAmount FROM savingsGoals WHERE id = $1', [tx.goalId]);
      if (goalRows.length > 0) {
        const goal = goalRows[0];
        let newCurrent = goal.currentAmount;
        if (tx.type === 'expense') newCurrent = Math.max(0, goal.currentAmount - tx.amount);
        else if (tx.type === 'income') newCurrent = goal.currentAmount + tx.amount;
        await db.execute('UPDATE savingsGoals SET currentAmount = $1, isCompleted = $2 WHERE id = $3',
          [newCurrent, newCurrent >= goal.targetAmount ? 1 : 0, tx.goalId]);
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
  // Only update fields that exist in the DB schema (exclude time, receiptUrl, tags)
  const allowedFields = ['accountId', 'toAccountId', 'categoryId', 'amount', 'type', 'date', 'notes', 'isRecurring', 'goalId', 'adminFee'];
  const fields = Object.keys(updates).filter(k => allowedFields.includes(k));
  if (fields.length === 0) return;

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => {
    const val = (updates as any)[f];
    if (f === 'isRecurring') return val ? 1 : 0;
    return val;
  });
  values.push(id);
  await db.execute(`UPDATE transactions SET ${setClause} WHERE id = $${values.length}`, values);
}

// ── Savings Goals ──────────────────────────────────────────────────────────

export async function depositSavingsGoal(goalId: string, accountId: string, amount: number, date: string, notes?: string) {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    const goalRows = await db.select<any[]>('SELECT currentAmount, targetAmount FROM savingsGoals WHERE id = $1', [goalId]);
    if (goalRows.length === 0) throw new Error('Target tabungan tidak ditemukan');
    const goal = goalRows[0];

    const txId = generateId();
    await db.execute(
      `INSERT INTO transactions (id, accountId, toAccountId, categoryId, amount, type, date, notes, isRecurring, goalId, adminFee, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [txId, accountId, null, 'cat_other_expense', amount, 'expense', date,
        notes || 'Setoran Tabungan', 0, goalId, 0, new Date().toISOString()]
    );

    await db.execute('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, accountId]);

    const newCurrent = goal.currentAmount + amount;
    await db.execute('UPDATE savingsGoals SET currentAmount = $1, isCompleted = $2 WHERE id = $3',
      [newCurrent, newCurrent >= goal.targetAmount ? 1 : 0, goalId]);

    await db.execute(
      `INSERT INTO savingsLogs (id, goalId, accountId, amount, date, notes, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [generateId(), goalId, accountId, amount, date, notes || null, new Date().toISOString()]
    );

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
    if (goalRows.length === 0) throw new Error('Target tabungan tidak ditemukan');
    const goal = goalRows[0];

    const txId = generateId();
    await db.execute(
      `INSERT INTO transactions (id, accountId, toAccountId, categoryId, amount, type, date, notes, isRecurring, goalId, adminFee, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [txId, accountId, null, 'cat_other_income', amount, 'income', date,
        notes || 'Pencairan Tabungan', 0, goalId, 0, new Date().toISOString()]
    );

    await db.execute('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, accountId]);

    const newCurrent = Math.max(0, goal.currentAmount - amount);
    await db.execute('UPDATE savingsGoals SET currentAmount = $1, isCompleted = $2 WHERE id = $3',
      [newCurrent, newCurrent >= goal.targetAmount ? 1 : 0, goalId]);

    await db.execute(
      `INSERT INTO savingsLogs (id, goalId, accountId, amount, date, notes, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [generateId(), goalId, accountId, -amount, date, notes || null, new Date().toISOString()]
    );

    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

// ── Installments ───────────────────────────────────────────────────────────

export async function payInstallment(installmentId: string, date: string) {
  const db = await getDb();
  await db.execute('BEGIN TRANSACTION');
  try {
    const instRows = await db.select<any[]>('SELECT * FROM installments WHERE id = $1', [installmentId]);
    if (instRows.length === 0) throw new Error('Cicilan tidak ditemukan');
    const inst = instRows[0];

    if (inst.isCompleted || inst.currentInstallment >= inst.totalTenorMonths) {
      await db.execute('ROLLBACK');
      throw new Error('Cicilan sudah lunas');
    }

    const newCurrent = inst.currentInstallment + 1;
    const isNowComplete = newCurrent >= inst.totalTenorMonths;

    // Determine category based on type
    const catId = inst.type === 'spaylater' ? 'cat_spaylater' : 'cat_spinjam';

    const txId = generateId();
    await db.execute(
      `INSERT INTO transactions (id, accountId, toAccountId, categoryId, amount, type, date, notes, isRecurring, goalId, adminFee, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [txId, inst.accountId, null, catId, inst.monthlyAmount, 'expense', date,
        `Cicilan ${inst.title} ke-${newCurrent}/${inst.totalTenorMonths}`,
        0, null, 0, new Date().toISOString()]
    );

    await db.execute('UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [inst.monthlyAmount, inst.accountId]);

    let nextDueDate: string | null = null;
    if (!isNowComplete && inst.nextDueDate) {
      const d = new Date(inst.nextDueDate);
      d.setMonth(d.getMonth() + 1);
      nextDueDate = d.toISOString().split('T')[0];
    }

    await db.execute(
      'UPDATE installments SET currentInstallment = $1, nextDueDate = $2, isCompleted = $3 WHERE id = $4',
      [newCurrent, nextDueDate, isNowComplete ? 1 : 0, installmentId]
    );

    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

// ── Reset & Backup ─────────────────────────────────────────────────────────

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
    await initializeDatabase();
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

export async function exportDatabaseBackup(): Promise<string> {
  const [accounts, categories, transactions, budgets, savingsGoals, savingsLogs, recurringTransactions, installments] = await Promise.all([
    getAccounts(), getCategories(), getTransactions(), getBudgets(),
    getSavingsGoals(), getSavingsLogs(), getRecurringTransactions(), getInstallments()
  ]);
  return JSON.stringify({
    version: 2,
    timestamp: new Date().toISOString(),
    data: { accounts, categories, transactions, budgets, savingsGoals, savingsLogs, recurringTransactions, installments }
  }, null, 2);
}

export async function importDatabaseBackup(jsonData: string): Promise<void> {
  const backup = JSON.parse(jsonData);
  if (!backup.data || !backup.data.accounts) throw new Error('Format backup tidak valid');

  await resetAllDataToDefault();
  const db = await getDb();

  await db.execute('BEGIN TRANSACTION');
  try {
    await db.execute('DELETE FROM accounts');
    await db.execute('DELETE FROM categories');

    for (const a of backup.data.accounts) {
      await db.execute(
        `INSERT INTO accounts (id, name, type, balance, icon, color, isDefault, accountNumber, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [a.id, a.name, a.type, a.balance || 0, a.icon, a.color,
          a.isDefault ? 1 : 0, a.accountNumber || null, a.createdAt || new Date().toISOString()]
      );
    }

    for (const c of backup.data.categories) {
      await db.execute(
        `INSERT INTO categories (id, name, type, icon, color, parentId, isDefault)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [c.id, c.name, c.type, c.icon, c.color, c.parentId || null, c.isDefault ? 1 : 0]
      );
    }

    for (const t of (backup.data.transactions || [])) {
      await db.execute(
        `INSERT INTO transactions (id, accountId, toAccountId, categoryId, amount, type, date, notes, isRecurring, goalId, adminFee, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [t.id, t.accountId, t.toAccountId || null, t.categoryId, t.amount, t.type, t.date,
          t.notes || null, t.isRecurring ? 1 : 0, t.goalId || null, t.adminFee || 0,
          t.createdAt || new Date().toISOString()]
      );
    }

    for (const b of (backup.data.budgets || [])) {
      await db.execute(
        `INSERT INTO budgets (id, categoryId, amountLimit, period, alertThreshold, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [b.id, b.categoryId, b.amountLimit, b.period, b.alertThreshold || null,
          b.createdAt || new Date().toISOString()]
      );
    }

    for (const s of (backup.data.savingsGoals || [])) {
      await db.execute(
        `INSERT INTO savingsGoals (id, name, targetAmount, currentAmount, targetDate, icon, color, notes, isCompleted, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [s.id, s.name, s.targetAmount, s.currentAmount || 0, s.targetDate || null,
          s.icon || null, s.color || null, s.notes || null, s.isCompleted ? 1 : 0,
          s.createdAt || new Date().toISOString()]
      );
    }

    for (const l of (backup.data.savingsLogs || [])) {
      await db.execute(
        `INSERT INTO savingsLogs (id, goalId, accountId, amount, date, notes, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [l.id, l.goalId, l.accountId, l.amount, l.date, l.notes || null,
          l.createdAt || new Date().toISOString()]
      );
    }

    for (const r of (backup.data.recurringTransactions || [])) {
      await db.execute(
        `INSERT INTO recurringTransactions (id, title, amount, type, categoryId, accountId, toAccountId, frequency, dayOfMonth, nextDueDate, notes, isActive, autoCreate, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [r.id, r.title, r.amount, r.type, r.categoryId, r.accountId, r.toAccountId || null,
          r.frequency, r.dayOfMonth || null, r.nextDueDate || null, r.notes || null,
          r.isActive ? 1 : 0, r.autoCreate ? 1 : 0, r.createdAt || new Date().toISOString()]
      );
    }

    for (const i of (backup.data.installments || [])) {
      await db.execute(
        `INSERT INTO installments (id, type, title, totalAmount, monthlyAmount, totalTenorMonths, currentInstallment, dueDayOfMonth, nextDueDate, accountId, notes, isCompleted, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [i.id, i.type, i.title, i.totalAmount || null, i.monthlyAmount, i.totalTenorMonths,
          i.currentInstallment || 0, i.dueDayOfMonth, i.nextDueDate || null,
          i.accountId, i.notes || null, i.isCompleted ? 1 : 0,
          i.createdAt || new Date().toISOString()]
      );
    }

    await db.execute('COMMIT');
  } catch (e) {
    await db.execute('ROLLBACK');
    throw e;
  }
}
