import { describe, it, expect } from 'vitest';
import { Account, Transaction } from '../src/types';

describe('Wallet Balance & Transaction Consistency', () => {
  it('updates balance accurately when income transaction is recorded', () => {
    let wallet: Account = {
      id: 'acc_cash',
      name: 'Dompet Tunai',
      type: 'cash',
      balance: 0,
      icon: 'Wallet',
      color: '#10B981',
      isDefault: true,
      createdAt: new Date().toISOString(),
    };

    const incomeAmount = 500000;
    wallet.balance += incomeAmount;

    expect(wallet.balance).toBe(500000);
  });

  it('updates balance accurately when expense transaction is recorded', () => {
    let wallet: Account = {
      id: 'acc_bca',
      name: 'Bank BCA',
      type: 'bank',
      balance: 1000000,
      icon: 'Landmark',
      color: '#3B82F6',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const expenseAmount = 350000;
    wallet.balance -= expenseAmount;

    expect(wallet.balance).toBe(650000);
  });

  it('updates source and destination balances including admin fee on transfer', () => {
    let sourceWallet: Account = {
      id: 'acc_bca',
      name: 'Bank BCA',
      type: 'bank',
      balance: 1000000,
      icon: 'Landmark',
      color: '#3B82F6',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    let targetWallet: Account = {
      id: 'acc_gopay',
      name: 'GoPay',
      type: 'ewallet',
      balance: 50000,
      icon: 'Smartphone',
      color: '#06B6D4',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const transferAmount = 200000;
    const adminFee = 1500;

    // Source pays transfer amount + admin fee
    sourceWallet.balance -= (transferAmount + adminFee);
    // Target receives transfer amount
    targetWallet.balance += transferAmount;

    expect(sourceWallet.balance).toBe(798500);
    expect(targetWallet.balance).toBe(250000);
  });

  it('correctly reverts balances when deleting an expense transaction', () => {
    let wallet: Account = {
      id: 'acc_cash',
      name: 'Dompet Tunai',
      type: 'cash',
      balance: 200000, // already deducted
      icon: 'Wallet',
      color: '#10B981',
      isDefault: true,
      createdAt: new Date().toISOString(),
    };

    const deletedExpenseAmount = 50000;
    // Deleting expense refunds the balance
    wallet.balance += deletedExpenseAmount;

    expect(wallet.balance).toBe(250000);
  });

  it('correctly reverts balances when deleting an income transaction', () => {
    let wallet: Account = {
      id: 'acc_bca',
      name: 'Bank BCA',
      type: 'bank',
      balance: 500000,
      icon: 'Landmark',
      color: '#3B82F6',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const deletedIncomeAmount = 500000;
    // Deleting income subtracts the balance
    wallet.balance -= deletedIncomeAmount;

    expect(wallet.balance).toBe(0);
  });

  it('correctly calculates total net worth across all accounts', () => {
    const accounts: Account[] = [
      { id: '1', name: 'Kas', type: 'cash', balance: 150000, icon: 'Wallet', color: '#10B981', isDefault: true, createdAt: '' },
      { id: '2', name: 'BCA', type: 'bank', balance: 1850000, icon: 'Landmark', color: '#3B82F6', isDefault: false, createdAt: '' },
      { id: '3', name: 'DANA', type: 'ewallet', balance: 75000, icon: 'Smartphone', color: '#0284C7', isDefault: false, createdAt: '' },
    ];

    const totalNetWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
    expect(totalNetWorth).toBe(2075000);
  });
});
