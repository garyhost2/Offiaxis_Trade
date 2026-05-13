import { z } from 'zod';

export const CreateReceiptSchema = z.object({
  projectId: z.string().optional(),
  vendor: z.string().min(1).max(200),
  amount: z.number().min(0),
  date: z.coerce.date(),
  category: z.string().min(1).max(100),
  imageUrl: z.string().url().optional(),
  note: z.string().max(1000).optional(),
});

export const UpdateReceiptSchema = CreateReceiptSchema.partial();

export const ReceiptResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  projectId: z.string().optional(),
  vendor: z.string(),
  amount: z.number(),
  date: z.date(),
  category: z.string(),
  imageUrl: z.string().optional(),
  note: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PaginatedReceiptsSchema = z.object({
  data: z.array(ReceiptResponseSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type CreateReceiptInput = z.infer<typeof CreateReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof UpdateReceiptSchema>;
