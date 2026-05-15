import {
  createExpense,
  listExpenses,
  createIncome,
  listIncome,
  aggregateExpenses,
  aggregateIncome,
} from './repository';
import { CreateExpenseInput, CreateIncomeInput } from './schema';
import { Expense, Income, ProfitLossSummary } from './types';
import mongoose from 'mongoose';

type ExpenseWithId = Expense & { _id: string };
type IncomeWithId = Income & { _id: string };

function toExpense(doc: Record<string, unknown>): ExpenseWithId {
  return {
    _id: (doc['_id'] as mongoose.Types.ObjectId).toString(),
    orgId: doc['orgId'] as string,
    projectId: doc['projectId'] as string | undefined,
    amount: doc['amount'] as number,
    category: doc['category'] as Expense['category'],
    jobType: doc['jobType'] as string | undefined,
    vendor: doc['vendor'] as string | undefined,
    date: doc['date'] as Date,
    note: doc['note'] as string | undefined,
    miles: doc['miles'] as number | undefined,
    ratePerMile: doc['ratePerMile'] as number | undefined,
    source: doc['source'] as Expense['source'],
    createdBy: doc['createdBy'] as string,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

function toIncome(doc: Record<string, unknown>): IncomeWithId {
  return {
    _id: (doc['_id'] as mongoose.Types.ObjectId).toString(),
    orgId: doc['orgId'] as string,
    projectId: doc['projectId'] as string | undefined,
    amount: doc['amount'] as number,
    type: doc['type'] as Income['type'],
    jobType: doc['jobType'] as string | undefined,
    date: doc['date'] as Date,
    note: doc['note'] as string | undefined,
    createdBy: doc['createdBy'] as string,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

export async function createExpenseService(
  orgId: string,
  createdBy: string,
  data: CreateExpenseInput
): Promise<ExpenseWithId> {
  const doc = await createExpense(orgId, createdBy, data);
  return toExpense(doc as unknown as Record<string, unknown>);
}

export async function listExpensesService(params: {
  orgId: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<ExpenseWithId[]> {
  const docs = await listExpenses(params);
  return docs.map((doc) => toExpense(doc as unknown as Record<string, unknown>));
}

export async function createIncomeService(
  orgId: string,
  createdBy: string,
  data: CreateIncomeInput
): Promise<IncomeWithId> {
  const doc = await createIncome(orgId, createdBy, data);
  return toIncome(doc as unknown as Record<string, unknown>);
}

export async function listIncomeService(params: {
  orgId: string;
  projectId?: string;
}): Promise<IncomeWithId[]> {
  const docs = await listIncome(params);
  return docs.map((doc) => toIncome(doc as unknown as Record<string, unknown>));
}

export async function getProfitLossSummary(params: {
  orgId: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<ProfitLossSummary> {
  const [categoryBreakdown, totalIncome] = await Promise.all([
    aggregateExpenses(params),
    aggregateIncome(params),
  ]);

  const expensesByCategory: Record<string, number> = {};
  let totalExpenses = 0;

  for (const entry of categoryBreakdown) {
    expensesByCategory[entry._id] = entry.total;
    totalExpenses += entry.total;
  }

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    expensesByCategory,
  };
}

export async function getBreakdown(params: {
  orgId: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  jobType?: string;
}): Promise<{ category: string; total: number }[]> {
  const breakdown = await aggregateExpenses(params);
  return breakdown.map((entry) => ({ category: entry._id, total: entry.total }));
}
