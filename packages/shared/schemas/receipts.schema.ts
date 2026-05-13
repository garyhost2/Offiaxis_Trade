import { z } from 'zod';

export const ReceiptSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  projectId: z.string().optional(),
  vendor: z.string().min(1),
  amount: z.number(),
  date: z.coerce.date(),
  category: z.string(),
  imageUrl: z.string().url().optional(),
  note: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

export const CreateReceiptSchema = ReceiptSchema.omit({ _id: true, orgId: true, createdBy: true, createdAt: true, updatedAt: true });
export const UpdateReceiptSchema = CreateReceiptSchema.partial();
