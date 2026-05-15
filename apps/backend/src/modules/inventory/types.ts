export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryItem {
  orgId: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  location?: string;
  supplier?: string;
  status: InventoryStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
