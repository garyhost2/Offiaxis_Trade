import { z } from 'zod';

export const ExpenseCategorySchema = z.enum(['labor', 'material', 'warranty', 'mileage', 'misc']);
export const JobTypeSchema = z.enum(['service_call', 'new_construction', 'remodel', 'warranty', 'emergency']);
export const IncomeTypeSchema = z.enum(['invoice', 'change_order', 'service_call', 'other']);
export const SourceSchema = z.enum(['manual', 'photo', 'voice']);

export const ExpenseSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  projectId: z.union([z.number(), z.string()]).optional(),
  amount: z.number(),
  category: ExpenseCategorySchema,
  jobType: JobTypeSchema.optional(),
  vendor: z.string().optional(),
  date: z.coerce.date(),
  note: z.string().optional(),
  miles: z.number().optional(),
  ratePerMile: z.number().optional(),
  source: SourceSchema.default('manual'),
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const IncomeSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  projectId: z.union([z.number(), z.string()]).optional(),
  amount: z.number(),
  type: IncomeTypeSchema,
  jobType: JobTypeSchema.optional(),
  date: z.coerce.date(),
  note: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type Income = z.infer<typeof IncomeSchema>;

export const CreateExpenseSchema = ExpenseSchema.omit({ _id: true, orgId: true, createdBy: true, createdAt: true, updatedAt: true });
export const CreateIncomeSchema = IncomeSchema.omit({ _id: true, orgId: true, createdBy: true, createdAt: true, updatedAt: true });

export const ProfitLossSummarySchema = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  profit: z.number(),
  breakdown: z.record(z.string(), z.number()),
});
