import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  db,
  initializeDatabase,
  payInstallment,
  resetAllDataToDefault,
} from '../src/lib/db';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '../src/lib/constants/defaults';

describe('User Configuration: Accounts, E-Wallets, SPayLater & SPinjam', () => {
  beforeEach(async () => {
    await db.accounts.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.budgets.clear();
    await db.savingsGoals.clear();
    await db.savingsLogs.clear();
    await db.installments.clear();
    await db.recurringTransactions.clear();
    await initializeDatabase();
  });

  it('default accounts only contain Bank BSI, Bank Jago, SeaBank, DANA, GoPay, ShopeePay', async () => {
    const accounts = await db.accounts.toArray();
    expect(accounts.length).toBe(6);

    const names = accounts.map((a) => a.name);
    expect(names).toContain('Bank BSI');
    expect(names).toContain('Bank Jago');
    expect(names).toContain('SeaBank');
    expect(names).toContain('DANA');
    expect(names).toContain('GoPay');
    expect(names).toContain('ShopeePay');

    // Pastikan tidak ada Bank BCA atau Dompet Tunai
    expect(names).not.toContain('Bank BCA');
    expect(names).not.toContain('Dompet Tunai');

    const banks = accounts.filter((a) => a.type === 'bank');
    const ewallets = accounts.filter((a) => a.type === 'ewallet');
    expect(banks.length).toBe(3);
    expect(ewallets.length).toBe(3);
  });

  it('default categories replace Tagihan & Utilitas with Cicilan SPayLater and Cicilan SPinjam', async () => {
    const categories = await db.categories.toArray();
    const ids = categories.map((c) => c.id);

    expect(ids).toContain('cat_spaylater');
    expect(ids).toContain('cat_spinjam');
    expect(ids).not.toContain('cat_bills');

    const spaylaterCat = categories.find((c) => c.id === 'cat_spaylater');
    expect(spaylaterCat?.name).toBe('Cicilan SPayLater');

    const spinjamCat = categories.find((c) => c.id === 'cat_spinjam');
    expect(spinjamCat?.name).toBe('Cicilan SPinjam');
  });

  it('paying SPayLater installment creates expense transaction, deducts wallet, and advances installment', async () => {
    const accounts = await db.accounts.toArray();
    const shopeepay = accounts.find((a) => a.id === 'acc_ewallet_shopeepay')!;

    // Set saldo awal ShopeePay Rp 1.000.000
    await db.accounts.update(shopeepay.id, { balance: 1000000 });

    const installmentId = 'inst_spay_1';
    await db.installments.add({
      id: installmentId,
      type: 'spaylater',
      title: 'Beli Sepatu Nike',
      monthlyAmount: 250000,
      totalTenorMonths: 3,
      currentInstallment: 1,
      dueDayOfMonth: 11,
      nextDueDate: '2026-09-11',
      accountId: shopeepay.id,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });

    // Bayar cicilan ke-1
    await payInstallment(installmentId);

    // Verifikasi saldo ShopeePay berkurang
    const updatedShopeepay = await db.accounts.get(shopeepay.id);
    expect(updatedShopeepay?.balance).toBe(750000);

    // Verifikasi transaksi pengeluaran tercatat
    const txs = await db.transactions.where('accountId').equals(shopeepay.id).toArray();
    expect(txs.length).toBe(1);
    expect(txs[0].amount).toBe(250000);
    expect(txs[0].type).toBe('expense');
    expect(txs[0].categoryId).toBe('cat_spaylater');
    expect(txs[0].notes).toContain('Cicilan SPayLater (1/3): Beli Sepatu Nike');

    // Verifikasi installment maju ke cicilan ke-2 dan nextDueDate bertambah
    const updatedInst = await db.installments.get(installmentId);
    expect(updatedInst?.currentInstallment).toBe(2);
    expect(updatedInst?.isCompleted).toBe(false);
    expect(updatedInst?.nextDueDate).toBe('2026-10-11');
  });

  it('paying final SPinjam installment marks it as completed (lunas)', async () => {
    const accounts = await db.accounts.toArray();
    const seabank = accounts.find((a) => a.id === 'acc_bank_seabank')!;

    await db.accounts.update(seabank.id, { balance: 2000000 });

    const pinjamId = 'inst_spin_1';
    await db.installments.add({
      id: pinjamId,
      type: 'spinjam',
      title: 'Modal Dagang Sampingan',
      monthlyAmount: 500000,
      totalTenorMonths: 3,
      currentInstallment: 3, // cicilan terakhir!
      dueDayOfMonth: 5,
      nextDueDate: '2026-09-05',
      accountId: seabank.id,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });

    // Bayar cicilan terakhir
    await payInstallment(pinjamId);

    const updatedSeabank = await db.accounts.get(seabank.id);
    expect(updatedSeabank?.balance).toBe(1500000);

    const updatedPinjam = await db.installments.get(pinjamId);
    expect(updatedPinjam?.isCompleted).toBe(true);
    expect(updatedPinjam?.currentInstallment).toBe(3);
  });

  it('resetAllDataToDefault properly clears installments and restores custom accounts and categories', async () => {
    await db.installments.add({
      id: 'inst_temp',
      type: 'spaylater',
      title: 'Temp',
      monthlyAmount: 10000,
      totalTenorMonths: 1,
      currentInstallment: 1,
      dueDayOfMonth: 1,
      nextDueDate: '2026-09-01',
      accountId: 'acc_bank_bsi',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });

    await resetAllDataToDefault();

    const insts = await db.installments.toArray();
    expect(insts.length).toBe(0);

    const accounts = await db.accounts.toArray();
    expect(accounts.length).toBe(6);
    expect(accounts.map((a) => a.name)).toEqual(DEFAULT_ACCOUNTS.map((a) => a.name));
  });
});
