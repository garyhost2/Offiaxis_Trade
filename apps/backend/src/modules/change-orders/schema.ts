import { z } from 'zod';

export const ChangeOrderStatusSchema = z.enum([
  'Submitted',
  'In Review',
  'Approved',
  'Rejected',
  'On Hold',
]);

export const ChangeOrderTypeSchema = z.enum(['Invoice', 'Change Order', 'Modification']);

export const StatusLogEntrySchema = z.object({
  status: ChangeOrderStatusSchema,
  changedBy: z.string(),
  changedAt: z.date(),
  note: z.string().optional(),
});

export const PaymentStatusLogEntrySchema = z.object({
  status: z.string(),
  changedBy: z.string(),
  changedAt: z.date(),
  note: z.string().optional(),
});

export const CreateChangeOrderSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  amount: z.number().min(0),
  date: z.coerce.date(),
  status: ChangeOrderStatusSchema.default('Submitted'),
  type: ChangeOrderTypeSchema,
  requestedBy: z.string().min(1),
  fileUrl: z.string().url().optional(),
});

export const UpdateChangeOrderSchema = z.object({
  status: ChangeOrderStatusSchema.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  amount: z.number().min(0).optional(),
  date: z.coerce.date().optional(),
  fileUrl: z.string().url().optional(),
  note: z.string().optional(),
});

export const ChangeOrderResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  amount: z.number(),
  date: z.date(),
  status: ChangeOrderStatusSchema,
  type: ChangeOrderTypeSchema,
  requestedBy: z.string(),
  fileUrl: z.string().optional(),
  statusLog: z.array(StatusLogEntrySchema),
  paymentStatusLog: z.array(PaymentStatusLogEntrySchema),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PaginatedChangeOrdersSchema = z.object({
  data: z.array(ChangeOrderResponseSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type CreateChangeOrderInput = z.infer<typeof CreateChangeOrderSchema>;
export type UpdateChangeOrderInput = z.infer<typeof UpdateChangeOrderSchema>;
