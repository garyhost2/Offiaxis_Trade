export type ExpenseCategory = 'labor' | 'material' | 'warranty' | 'mileage' | 'misc';
export type IncomeType = 'invoice' | 'change_order' | 'service_call' | 'other';
export type DataSource = 'manual' | 'photo' | 'voice';

export interface Expense {
  orgId: string;
  projectId?: string;
  amount: number;
  category: ExpenseCategory;
  jobType?: string;
  vendor?: string;
  date: Date;
  note?: string;
  miles?: number;
  ratePerMile?: number;
  source: DataSource;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Income {
  orgId: string;
  projectId?: string;
  amount: number;
  type: IncomeType;
  jobType?: string;
  date: Date;
  note?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfitLossSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  expensesByCategory: Record<string, number>;
}
