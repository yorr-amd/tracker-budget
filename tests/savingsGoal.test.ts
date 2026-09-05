import { describe, it, expect } from 'vitest';

describe('Savings Goal Calculations & Status', () => {
  it('calculates progress percentage correctly', () => {
    const targetAmount = 10000000;
    const currentAmount = 2500000;
    const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

    expect(progress).toBe(25);
    expect(targetAmount - currentAmount).toBe(7500000);
  });

  it('detects goal completion when target is reached', () => {
    const targetAmount = 5000000;
    const currentAmount = 5000000;
    const progress = (currentAmount / targetAmount) * 100;
    const isCompleted = progress >= 100;

    expect(isCompleted).toBe(true);
    expect(progress).toBe(100);
  });

  it('detects goal completion when target is exceeded', () => {
    const targetAmount = 5000000;
    const currentAmount = 5500000;
    const progress = (currentAmount / targetAmount) * 100;
    const isCompleted = progress >= 100;

    expect(isCompleted).toBe(true);
    expect(progress).toBeCloseTo(110);
  });

  it('updates goal current amount and wallet balance after deposit', () => {
    let walletBalance = 3000000;
    let goalCurrentAmount = 1000000;
    const depositAmount = 500000;

    // Simulation of deposit logic
    walletBalance -= depositAmount;
    goalCurrentAmount += depositAmount;

    expect(walletBalance).toBe(2500000);
    expect(goalCurrentAmount).toBe(1500000);
  });

  it('handles 0 target amount without error', () => {
    const targetAmount = 0;
    const currentAmount = 0;
    const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

    expect(progress).toBe(0);
  });
});
