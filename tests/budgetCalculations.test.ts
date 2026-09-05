import { describe, it, expect } from 'vitest';

describe('Budget & Financial Allocation Calculations', () => {
  describe('Spending vs Budget Limit', () => {
    it('calculates correct percentage of spending', () => {
      const amountLimit = 1000000;
      const spent = 450000;
      const percent = (spent / amountLimit) * 100;
      const remaining = amountLimit - spent;

      expect(percent).toBe(45);
      expect(remaining).toBe(550000);
    });

    it('identifies safe state when spending is below 80%', () => {
      const amountLimit = 1000000;
      const spent = 700000;
      const percent = (spent / amountLimit) * 100;
      const isOver = spent > amountLimit;
      const isWarning = percent >= 80 && percent <= 100;

      expect(percent).toBe(70);
      expect(isOver).toBe(false);
      expect(isWarning).toBe(false);
    });

    it('identifies warning state when spending is between 80% and 100%', () => {
      const amountLimit = 1000000;
      const spent = 850000;
      const percent = (spent / amountLimit) * 100;
      const isOver = spent > amountLimit;
      const isWarning = percent >= 80 && percent <= 100;

      expect(isOver).toBe(false);
      expect(isWarning).toBe(true);
    });

    it('identifies overbudget state when spending exceeds limit', () => {
      const amountLimit = 1000000;
      const spent = 1250000;
      const percent = (spent / amountLimit) * 100;
      const isOver = spent > amountLimit;
      const excess = spent - amountLimit;

      expect(isOver).toBe(true);
      expect(percent).toBe(125);
      expect(excess).toBe(250000);
    });

    it('handles zero budget limit edge case without division by zero', () => {
      const amountLimit = 0;
      const spent = 100000;
      const percent = amountLimit > 0 ? (spent / amountLimit) * 100 : 0;
      expect(percent).toBe(0);
    });
  });

  describe('50/30/20 Financial Rule Calculations', () => {
    it('accurately divides income into 50% Needs, 30% Wants, and 20% Savings', () => {
      const totalIncome = 10000000; // 10 Million IDR
      const needs50 = totalIncome * 0.5;
      const wants30 = totalIncome * 0.3;
      const savings20 = totalIncome * 0.2;

      expect(needs50).toBe(5000000);
      expect(wants30).toBe(3000000);
      expect(savings20).toBe(2000000);
      expect(needs50 + wants30 + savings20).toBe(totalIncome);
    });

    it('handles 0 income gracefully', () => {
      const totalIncome = 0;
      const needs50 = totalIncome * 0.5;
      const wants30 = totalIncome * 0.3;
      const savings20 = totalIncome * 0.2;

      expect(needs50).toBe(0);
      expect(wants30).toBe(0);
      expect(savings20).toBe(0);
    });

    it('calculates savings rate percentage accurately', () => {
      const income = 10000000;
      const expense = 6500000;
      const netSavings = income - expense;
      const savingsRate = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

      expect(netSavings).toBe(3500000);
      expect(savingsRate).toBe(35);
    });

    it('returns 0% savings rate when expenses exceed income (deficit)', () => {
      const income = 5000000;
      const expense = 6000000;
      const netSavings = income - expense;
      const savingsRate = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

      expect(netSavings).toBe(-1000000);
      expect(savingsRate).toBe(0);
    });
  });
});
