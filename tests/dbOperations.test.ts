import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  db,
  createTransaction,
  deleteTransaction,
  updateTransaction,
  depositSavingsGoal,
  withdrawSavingsGoal,
  initializeDatabase,
  importDatabaseBackup,
  exportDatabaseBackup,
  validateBackupData,
} from '../src/lib/db';
import { calculateNextDueDate } from '../src/lib/utils';

describe('Real DB Operations & Priority Fixes (Dexie + fake-indexeddb)', () => {
  beforeEach(async () => {
    await db.accounts.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.budgets.clear();
    await db.savingsGoals.clear();
    await db.savingsLogs.clear();
    await db.recurringTransactions.clear();
    await initializeDatabase();
  });

  describe('Prioritas 1: Savings Goal & Transaction Consistency', () => {
    it('deleting deposit transaction automatically rolls back savings goal and deletes log (no money duplication)', async () => {
      const accounts = await db.accounts.toArray();
      const acc = accounts[0];
      const initialBalance = acc.balance;

      await db.savingsGoals.add({
        id: 'goal_laptop',
        name: 'Beli Laptop',
        targetAmount: 5000000,
        currentAmount: 0,
        icon: 'Laptop',
        color: '#10B981',
        createdAt: new Date().toISOString(),
      });

      // 1. Setor Rp 500.000 ke tabungan
      await depositSavingsGoal('goal_laptop', acc.id, 500000);

      const goalAfterDeposit = await db.savingsGoals.get('goal_laptop');
      expect(goalAfterDeposit?.currentAmount).toBe(500000);

      const accAfterDeposit = await db.accounts.get(acc.id);
      expect(accAfterDeposit?.balance).toBe(initialBalance - 500000);

      // Cari transaksi yang terbuat
      const txs = await db.transactions.where('accountId').equals(acc.id).toArray();
      const depositTx = txs.find((t) => t.goalId === 'goal_laptop');
      expect(depositTx).toBeDefined();
      expect(depositTx?.amount).toBe(500000);
      expect(depositTx?.type).toBe('expense');

      // 2. User menghapus transaksi deposit dari Riwayat Transaksi
      await deleteTransaction(depositTx!.id);

      const accAfterDelete = await db.accounts.get(acc.id);
      const goalAfterDelete = await db.savingsGoals.get('goal_laptop');
      const logsAfterDelete = await db.savingsLogs.where('goalId').equals('goal_laptop').toArray();

      // Saldo akun dikembalikan
      expect(accAfterDelete?.balance).toBe(initialBalance);
      // Saldo goal juga dikembalikan ke 0 (Bug duplikasi uang teratasi!)
      expect(goalAfterDelete?.currentAmount).toBe(0);
      // Log setoran tabungan terhapus
      expect(logsAfterDelete.length).toBe(0);
    });

    it('withdrawSavingsGoal transfers money from goal to wallet and records income transaction', async () => {
      const accounts = await db.accounts.toArray();
      const acc = accounts[0];
      const initialBalance = acc.balance;

      await db.savingsGoals.add({
        id: 'goal_liburan',
        name: 'Liburan Bali',
        targetAmount: 3000000,
        currentAmount: 2000000, // sudah ada 2 juta
        icon: 'Plane',
        color: '#3B82F6',
        createdAt: new Date().toISOString(),
      });

      // Cairkan Rp 800.000 ke rekening
      await withdrawSavingsGoal('goal_liburan', acc.id, 800000, 'Tarik dana tiket');

      const goalAfter = await db.savingsGoals.get('goal_liburan');
      const accAfter = await db.accounts.get(acc.id);

      expect(goalAfter?.currentAmount).toBe(1200000);
      expect(accAfter?.balance).toBe(initialBalance + 800000);

      // Verifikasi log tabungan mencatat nilai negatif
      const logs = await db.savingsLogs.where('goalId').equals('goal_liburan').toArray();
      expect(logs.some((l) => l.amount === -800000)).toBe(true);

      // Verifikasi transaksi income tercipta dengan goalId
      const txs = await db.transactions.where('accountId').equals(acc.id).toArray();
      const withdrawTx = txs.find((t) => t.goalId === 'goal_liburan');
      expect(withdrawTx).toBeDefined();
      expect(withdrawTx?.type).toBe('income');
      expect(withdrawTx?.amount).toBe(800000);

      // 3. Jika transaksi penarikan tersebut dihapus dari riwayat transaksi
      await deleteTransaction(withdrawTx!.id);
      const accAfterDelete = await db.accounts.get(acc.id);
      const goalAfterDelete = await db.savingsGoals.get('goal_liburan');

      // Saldo akun dipotong kembali 800rb, saldo tabungan kembali 2jt
      expect(accAfterDelete?.balance).toBe(initialBalance);
      expect(goalAfterDelete?.currentAmount).toBe(2000000);
    });

    it('rejects withdrawal if requested amount exceeds current goal amount or is non-positive', async () => {
      const accounts = await db.accounts.toArray();
      const acc = accounts[0];

      await db.savingsGoals.add({
        id: 'goal_kecil',
        name: 'Wishlist',
        targetAmount: 1000000,
        currentAmount: 200000,
        icon: 'Gift',
        color: '#10B981',
        createdAt: new Date().toISOString(),
      });

      await expect(withdrawSavingsGoal('goal_kecil', acc.id, 500000)).rejects.toThrow(/Saldo tabungan tidak mencukupi/);
      await expect(withdrawSavingsGoal('goal_kecil', acc.id, 0)).rejects.toThrow(/Nominal pencairan harus lebih dari Rp 0/);
    });
  });

  describe('Prioritas 2: Budgets Period Isolation', () => {
    it('isolates budgets by period (e.g. 2026-08 vs 2026-09)', async () => {
      // Simpan budget periode 2026-08
      await db.budgets.add({
        id: 'b_aug',
        categoryId: 'cat_food',
        period: '2026-08',
        amountLimit: 1000000,
        createdAt: new Date().toISOString(),
      });

      // Simpan budget periode 2026-09
      await db.budgets.add({
        id: 'b_sep',
        categoryId: 'cat_food',
        period: '2026-09',
        amountLimit: 1500000,
        createdAt: new Date().toISOString(),
      });

      const allBudgets = await db.budgets.toArray();
      expect(allBudgets.length).toBe(2);

      // Filter periode September
      const sepBudgets = allBudgets.filter((b) => b.period === '2026-09');
      expect(sepBudgets.length).toBe(1);
      expect(sepBudgets[0].amountLimit).toBe(1500000);

      // Filter periode Agustus
      const augBudgets = allBudgets.filter((b) => b.period === '2026-08');
      expect(augBudgets.length).toBe(1);
      expect(augBudgets[0].amountLimit).toBe(1000000);
    });
  });

  describe('Prioritas 3: Recurring Transactions & Next Due Date Calculation', () => {
    it('accurately advances nextDueDate for daily, weekly, monthly, and yearly frequencies', () => {
      expect(calculateNextDueDate('2026-01-15', 'daily')).toBe('2026-01-16');
      expect(calculateNextDueDate('2026-01-15', 'weekly')).toBe('2026-01-22');
      expect(calculateNextDueDate('2026-01-15', 'monthly')).toBe('2026-02-15');
      expect(calculateNextDueDate('2026-01-15', 'yearly')).toBe('2027-01-15');
    });

    it('handles end-of-month dates gracefully when calculating next monthly due date', () => {
      // 31 Januari -> Februari memiliki maksimal 28 hari (2026 bukan tahun kabisat)
      const nextFeb = calculateNextDueDate('2026-01-31', 'monthly', 31);
      expect(nextFeb).toBe('2026-02-28');

      // 31 Maret -> 30 April
      const nextApr = calculateNextDueDate('2026-03-31', 'monthly', 31);
      expect(nextApr).toBe('2026-04-30');
    });

    it('updating recurring transaction preserves isActive status', async () => {
      const accounts = await db.accounts.toArray();
      const recId = 'rec_wifi';

      await db.recurringTransactions.add({
        id: recId,
        title: 'Wi-Fi Indihome',
        type: 'expense',
        amount: 350000,
        accountId: accounts[0].id,
        categoryId: 'cat_bills',
        frequency: 'monthly',
        nextDueDate: '2026-09-10',
        autoCreate: true,
        isActive: false, // sengaja dinonaktifkan
        createdAt: new Date().toISOString(),
      });

      // Update nominal tanpa mereset isActive
      await db.recurringTransactions.update(recId, { amount: 375000 });

      const updated = await db.recurringTransactions.get(recId);
      expect(updated?.amount).toBe(375000);
      expect(updated?.isActive).toBe(false); // tetap false!
    });
  });

  describe('Prioritas 4: Safety & Schema Validation on Restore Backup', () => {
    it('rejects corrupted or non-array backup JSON without clearing existing database', async () => {
      const accountsBefore = await db.accounts.toArray();
      expect(accountsBefore.length).toBeGreaterThan(0);

      // File rusak: properti data bukan array
      const corruptedBackup = {
        version: 1,
        data: {
          accounts: 'bukan_array',
        },
      };

      await expect(importDatabaseBackup(corruptedBackup)).rejects.toThrow(/Format data "accounts" harus berupa array/);

      // Database lokal TIDAK boleh terhapus!
      const accountsAfter = await db.accounts.toArray();
      expect(accountsAfter.length).toBe(accountsBefore.length);
    });

    it('rejects backup records with invalid properties without wiping data', async () => {
      const categoriesBefore = await db.categories.toArray();

      const invalidAccountBackup = {
        version: 1,
        data: {
          accounts: [{ id: 'acc_1' }], // missing name & balance
        },
      };

      await expect(importDatabaseBackup(invalidAccountBackup)).rejects.toThrow(/tidak valid/);

      const categoriesAfter = await db.categories.toArray();
      expect(categoriesAfter.length).toBe(categoriesBefore.length);
    });

    it('successfully imports and restores a valid backup', async () => {
      const backupData = await exportDatabaseBackup();
      expect(backupData.data.accounts.length).toBeGreaterThan(0);

      // Import kembali backup yang valid
      await importDatabaseBackup(backupData);

      const accounts = await db.accounts.toArray();
      expect(accounts.length).toBe(backupData.data.accounts.length);
    });
  });
});
