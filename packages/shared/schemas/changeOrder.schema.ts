import { z } from 'zod';

export const ChangeOrderStatusSchema = z.enum(['Submitted', 'In Review', 'Approved', 'Rejected', 'On Hold']);
export const ChangeOrderTypeSchema = z.enum(['Invoice', 'Change Order', 'Modification']);

export const StatusLogSchema = z.object({
  id: z.string(),
  timestamp: z.coerce.date(),
  oldStatus: z.string(),
  newStatus: z.string(),
  note: z.string().optional(),
  changedBy: z.string().optional(),
});

export const PaymentStatusLogSchema = StatusLogSchema.extend({
  paidAmount: z.number().optional(),
});

export const ChangeOrderSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  projectId: z.union([z.number(), z.string()]),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number(),
  date: z.string(),
  status: ChangeOrderStatusSchema,
  type: ChangeOrderTypeSchema,
  requestedBy: z.string(),
  fileUrl: z.string().optional(),
  statusLog: z.array(StatusLogSchema).default([]),
  paymentStatusLog: z.array(PaymentStatusLogSchema).default([]),
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type ChangeOrder = z.infer<typeof ChangeOrderSchema>;

export const CreateChangeOrderSchema = ChangeOrderSchema.omit({ _id: true, orgId: true, createdBy: true, statusLog: true, paymentStatusLog: true, createdAt: true, updatedAt: true });
export const UpdateChangeOrderSchema = CreateChangeOrderSchema.partial();
