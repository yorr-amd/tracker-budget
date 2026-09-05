import React, { useState } from 'react';
import { HeroBanner } from '@/components/dashboard/HeroBanner';
import { CategoryFilterBar } from '@/components/dashboard/CategoryFilterBar';
import { FinancialOverviewCards } from '@/components/dashboard/FinancialOverviewCards';
import { SmartFinancialInsights } from '@/components/dashboard/SmartFinancialInsights';
import { FinancialMilestoneTicket } from '@/components/dashboard/FinancialMilestoneTicket';
import { ExpenseBreakdownChart } from '@/components/dashboard/ExpenseBreakdownChart';
import { CashflowTrendChart } from '@/components/dashboard/CashflowTrendChart';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { AccountModal } from '@/components/forms/AccountModal';
import { BudgetModal } from '@/components/forms/BudgetModal';
import { SavingsGoalModal } from '@/components/forms/SavingsGoalModal';
import { TransactionModal } from '@/components/forms/TransactionModal';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Transaction, ActiveTab } from '@/types';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { accounts, transactions, budgets, savingsGoals, calculateSummary } = useBudgetStore();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const summary = calculateSummary();

  // Hitung total tabungan dari savings goal atau akun bank/tabungan
  const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

  // Hitung total investasi dari akun bertipe 'investment'
  const totalInvestments = accounts
    .filter((a) => a.type === 'investment')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO SECTION (Header Utama Maroon/Burgundy) */}
      <HeroBanner
        totalBalance={summary.totalBalance}
        netSavings={summary.netSavings}
        onOpenTransactionModal={() => setIsTxModalOpen(true)}
        onNavigate={onNavigate}
      />

      {/* 2. CATEGORY / FILTER BAR (Pemasukan, Pengeluaran, Tabungan, Investasi) */}
      <CategoryFilterBar
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        totalSavings={totalSavings}
        totalInvestments={totalInvestments}
        onNavigate={onNavigate}
      />

      {/* 3. OVERVIEW CARDS (Pengganti Bestsellers) */}
      <FinancialOverviewCards
        summary={summary}
        accountsCount={accounts.length}
        budgets={budgets}
        goals={savingsGoals}
        onNavigate={onNavigate}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenGoalModal={() => setIsGoalModalOpen(true)}
      />

      {/* 4. SMART FINANCIAL INSIGHTS (Pengganti Our Promise) */}
      <SmartFinancialInsights
        summary={summary}
        onNavigate={onNavigate}
      />

      {/* 5. FINANCIAL MILESTONE TICKET (Pengganti The Magical Ticket) */}
      <FinancialMilestoneTicket
        onNavigate={onNavigate}
      />

      {/* ANALYTICS CHARTS (Grafik Alokasi & Arus Kas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <ExpenseBreakdownChart summary={summary} />
        <CashflowTrendChart transactions={transactions} />
      </div>

      {/* RECENT TRANSACTIONS (Daftar Transaksi Terakhir) */}
      <div className="pt-2">
        <RecentTransactionsList
          onEditTransaction={(tx) => setEditingTransaction(tx)}
          onNavigate={onNavigate}
        />
      </div>

      {/* MODALS */}
      <TransactionModal
        isOpen={isTxModalOpen || !!editingTransaction}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />

      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
    </div>
  );
};
