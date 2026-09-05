import { describe, it, expect } from 'vitest';

describe('Form Validations & Edge Cases', () => {
  describe('Transaction Validation Rules', () => {
    function validateTransaction(tx: {
      type: string;
      amount: number;
      accountId: string;
      toAccountId?: string;
      categoryId?: string;
    }): { isValid: boolean; error?: string } {
      if (!tx.amount || tx.amount <= 0) {
        return { isValid: false, error: 'Harap masukkan nominal transaksi lebih dari 0.' };
      }
      if (!tx.accountId) {
        return { isValid: false, error: 'Harap pilih akun / dompet sumber.' };
      }
      if (tx.type === 'transfer' && (!tx.toAccountId || tx.toAccountId === tx.accountId)) {
        return { isValid: false, error: 'Harap pilih akun tujuan transfer yang berbeda dengan akun sumber.' };
      }
      if (tx.type !== 'transfer' && !tx.categoryId) {
        return { isValid: false, error: 'Harap pilih kategori transaksi.' };
      }
      return { isValid: true };
    }

    it('rejects transactions with 0 or negative amounts', () => {
      expect(validateTransaction({ type: 'expense', amount: 0, accountId: 'acc_1', categoryId: 'cat_1' }).isValid).toBe(false);
      expect(validateTransaction({ type: 'expense', amount: -50000, accountId: 'acc_1', categoryId: 'cat_1' }).isValid).toBe(false);
    });

    it('rejects transfer when source and target wallets are identical', () => {
      const res = validateTransaction({
        type: 'transfer',
        amount: 100000,
        accountId: 'acc_bca',
        toAccountId: 'acc_bca',
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('berbeda dengan akun sumber');
    });

    it('accepts valid transfer between distinct wallets', () => {
      const res = validateTransaction({
        type: 'transfer',
        amount: 100000,
        accountId: 'acc_bca',
        toAccountId: 'acc_gopay',
      });
      expect(res.isValid).toBe(true);
    });

    it('accepts valid expense with required fields', () => {
      const res = validateTransaction({
        type: 'expense',
        amount: 25000,
        accountId: 'acc_cash',
        categoryId: 'cat_food',
      });
      expect(res.isValid).toBe(true);
    });
  });

  describe('Budget Validation Rules', () => {
    function validateBudget(b: { categoryId: string; amountLimit: number }) {
      if (!b.categoryId) return { isValid: false, error: 'Pilih kategori pengeluaran.' };
      if (!b.amountLimit || b.amountLimit <= 0) return { isValid: false, error: 'Batas anggaran harus lebih dari Rp 0.' };
      return { isValid: true };
    }

    it('rejects non-positive budget limits', () => {
      expect(validateBudget({ categoryId: 'cat_food', amountLimit: 0 }).isValid).toBe(false);
      expect(validateBudget({ categoryId: 'cat_food', amountLimit: -100000 }).isValid).toBe(false);
    });

    it('accepts valid budget limit', () => {
      expect(validateBudget({ categoryId: 'cat_food', amountLimit: 1500000 }).isValid).toBe(true);
    });
  });

  describe('Savings Goal Validation Rules', () => {
    function validateGoal(g: { name: string; targetAmount: number }) {
      if (!g.name.trim()) return { isValid: false, error: 'Nama target tabungan tidak boleh kosong.' };
      if (!g.targetAmount || g.targetAmount <= 0) return { isValid: false, error: 'Target nominal harus lebih dari Rp 0.' };
      return { isValid: true };
    }

    it('rejects empty or whitespace-only goal names', () => {
      expect(validateGoal({ name: '   ', targetAmount: 1000000 }).isValid).toBe(false);
    });

    it('rejects non-positive target amount', () => {
      expect(validateGoal({ name: 'Liburan Bali', targetAmount: 0 }).isValid).toBe(false);
    });

    it('accepts valid savings goal', () => {
      expect(validateGoal({ name: 'Liburan Bali', targetAmount: 5000000 }).isValid).toBe(true);
    });
  });
});
