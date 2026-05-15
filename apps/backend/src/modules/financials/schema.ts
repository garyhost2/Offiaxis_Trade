import { z } from 'zod';

export const ExpenseCategorySchema = z.enum([
  'labor',
  'material',
  'warranty',
  'mileage',
  'misc',
]);

export const IncomeTypeSchema = z.enum([
  'invoice',
  'change_order',
  'service_call',
  'other',
]);

export const DataSourceSchema = z.enum(['manual', 'photo', 'voice']);

export const CreateExpenseSchema = z.object({
  projectId: z.string().optional(),
  amount: z.number().min(0),
  category: ExpenseCategorySchema,
  jobType: z.string().optional(),
  vendor: z.string().optional(),
  date: z.coerce.date(),
  note: z.string().max(1000).optional(),
  miles: z.number().min(0).optional(),
  ratePerMile: z.number().min(0).optional(),
  source: DataSourceSchema.default('manual'),
});

export const CreateIncomeSchema = z.object({
  projectId: z.string().optional(),
  amount: z.number().min(0),
  type: IncomeTypeSchema,
  jobType: z.string().optional(),
  date: z.coerce.date(),
  note: z.string().max(1000).optional(),
});

export const ExpenseResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  projectId: z.string().optional(),
  amount: z.number(),
  category: ExpenseCategorySchema,
  jobType: z.string().optional(),
  vendor: z.string().optional(),
  date: z.date(),
  note: z.string().optional(),
  miles: z.number().optional(),
  ratePerMile: z.number().optional(),
  source: DataSourceSchema,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const IncomeResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  projectId: z.string().optional(),
  amount: z.number(),
  type: IncomeTypeSchema,
  jobType: z.string().optional(),
  date: z.date(),
  note: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProfitLossSummarySchema = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  netProfit: z.number(),
  expensesByCategory: z.record(z.string(), z.number()),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type CreateIncomeInput = z.infer<typeof CreateIncomeSchema>;
