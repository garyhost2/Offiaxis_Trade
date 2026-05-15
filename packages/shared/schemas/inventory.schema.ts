import { z } from 'zod';

export const InventoryStatusSchema = z.enum(['in_stock', 'low_stock', 'out_of_stock']);

export const InventoryItemSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string(),
  quantity: z.number().min(0),
  unit: z.string(),
  unitCost: z.number().min(0),
  location: z.string().optional(),
  supplier: z.string().optional(),
  status: InventoryStatusSchema,
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const CreateInventoryItemSchema = InventoryItemSchema.omit({ _id: true, orgId: true, createdBy: true, createdAt: true, updatedAt: true });
export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial();
