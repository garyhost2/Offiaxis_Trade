import mongoose, { Document, Schema } from 'mongoose';
import { Expense, Income, ExpenseCategory, IncomeType, DataSource } from './types';
import { CreateExpenseInput, CreateIncomeInput } from './schema';

interface IExpenseDocument extends Omit<Expense, 'createdAt' | 'updatedAt'>, Document {}
interface IIncomeDocument extends Omit<Income, 'createdAt' | 'updatedAt'>, Document {}

const expenseSchema = new Schema<IExpenseDocument>(
  {
    orgId: { type: String, required: true },
    projectId: { type: String },
    amount: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ['labor', 'material', 'warranty', 'mileage', 'misc'] as ExpenseCategory[],
    },
    jobType: { type: String },
    vendor: { type: String },
    date: { type: Date, required: true },
    note: { type: String },
    miles: { type: Number },
    ratePerMile: { type: Number },
    source: {
      type: String,
      required: true,
      enum: ['manual', 'photo', 'voice'] as DataSource[],
      default: 'manual',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ orgId: 1 });
expenseSchema.index({ orgId: 1, createdAt: -1 });

export const ExpenseModel = mongoose.model<IExpenseDocument>('Expense', expenseSchema);

const incomeSchema = new Schema<IIncomeDocument>(
  {
    orgId: { type: String, required: true },
    projectId: { type: String },
    amount: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ['invoice', 'change_order', 'service_call', 'other'] as IncomeType[],
    },
    jobType: { type: String },
    date: { type: Date, required: true },
    note: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

incomeSchema.index({ orgId: 1 });
incomeSchema.index({ orgId: 1, createdAt: -1 });

export const IncomeModel = mongoose.model<IIncomeDocument>('Income', incomeSchema);

export async function createExpense(
  orgId: string,
  createdBy: string,
  data: CreateExpenseInput
): Promise<IExpenseDocument> {
  return ExpenseModel.create({ ...data, orgId, createdBy });
}

export async function listExpenses(params: {
  orgId: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<IExpenseDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.projectId) query['projectId'] = params.projectId;
  if (params.startDate ?? params.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (params.startDate) dateFilter['$gte'] = params.startDate;
    if (params.endDate) dateFilter['$lte'] = params.endDate;
    query['date'] = dateFilter;
  }
  return ExpenseModel.find(query).sort({ date: -1 }).exec();
}

export async function createIncome(
  orgId: string,
  createdBy: string,
  data: CreateIncomeInput
): Promise<IIncomeDocument> {
  return IncomeModel.create({ ...data, orgId, createdBy });
}

export async function listIncome(params: {
  orgId: string;
  projectId?: string;
}): Promise<IIncomeDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.projectId) query['projectId'] = params.projectId;
  return IncomeModel.find(query).sort({ date: -1 }).exec();
}

export async function aggregateExpenses(params: {
  orgId: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  jobType?: string;
}): Promise<{ _id: string; total: number }[]> {
  const match: Record<string, unknown> = { orgId: params.orgId };
  if (params.projectId) match['projectId'] = params.projectId;
  if (params.jobType) match['jobType'] = params.jobType;
  if (params.startDate ?? params.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (params.startDate) dateFilter['$gte'] = params.startDate;
    if (params.endDate) dateFilter['$lte'] = params.endDate;
    match['date'] = dateFilter;
  }

  return ExpenseModel.aggregate<{ _id: string; total: number }>([
    { $match: match },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]).exec();
}

export async function aggregateIncome(params: {
  orgId: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<number> {
  const match: Record<string, unknown> = { orgId: params.orgId };
  if (params.projectId) match['projectId'] = params.projectId;
  if (params.startDate ?? params.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (params.startDate) dateFilter['$gte'] = params.startDate;
    if (params.endDate) dateFilter['$lte'] = params.endDate;
    match['date'] = dateFilter;
  }

  const result = await IncomeModel.aggregate<{ total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]).exec();

  return result[0]?.total ?? 0;
}
