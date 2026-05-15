import { z } from 'zod';

export const InventoryStatusSchema = z.enum(['in_stock', 'low_stock', 'out_of_stock']);

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().optional(),
  category: z.string().min(1).max(100),
  quantity: z.number().min(0),
  unit: z.string().min(1).max(50),
  unitCost: z.number().min(0),
  location: z.string().optional(),
  supplier: z.string().optional(),
  status: InventoryStatusSchema.default('in_stock'),
});

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial();

export const InventoryItemResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  name: z.string(),
  sku: z.string().optional(),
  category: z.string(),
  quantity: z.number(),
  unit: z.string(),
  unitCost: z.number(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  status: InventoryStatusSchema,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PaginatedInventorySchema = z.object({
  data: z.array(InventoryItemResponseSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>;
