import mongoose, { Document, Schema } from 'mongoose';
import { InventoryItem, InventoryStatus } from './types';
import { CreateInventoryItemInput, UpdateInventoryItemInput } from './schema';

interface IInventoryDocument extends Omit<InventoryItem, 'createdAt' | 'updatedAt'>, Document {}

const inventorySchema = new Schema<IInventoryDocument>(
  {
    orgId: { type: String, required: true },
    name: { type: String, required: true },
    sku: { type: String },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    unitCost: { type: Number, required: true },
    location: { type: String },
    supplier: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['in_stock', 'low_stock', 'out_of_stock'] as InventoryStatus[],
      default: 'in_stock',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

inventorySchema.index({ orgId: 1 });
inventorySchema.index({ orgId: 1, createdAt: -1 });
inventorySchema.index({ orgId: 1, status: 1 });

export const InventoryItemModel = mongoose.model<IInventoryDocument>('InventoryItem', inventorySchema);

export async function createInventoryItem(
  orgId: string,
  createdBy: string,
  data: CreateInventoryItemInput
): Promise<IInventoryDocument> {
  return InventoryItemModel.create({ ...data, orgId, createdBy });
}

export async function findInventoryItemById(
  id: string,
  orgId: string
): Promise<IInventoryDocument | null> {
  return InventoryItemModel.findOne({ _id: id, orgId }).exec();
}

export async function listInventoryItems(params: {
  orgId: string;
  cursor?: string;
  limit: number;
  status?: InventoryStatus;
}): Promise<IInventoryDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.status) query['status'] = params.status;
  if (params.cursor) query['_id'] = { $gt: new mongoose.Types.ObjectId(params.cursor) };
  return InventoryItemModel.find(query).sort({ _id: 1 }).limit(params.limit + 1).exec();
}

export async function updateInventoryItem(
  id: string,
  orgId: string,
  data: UpdateInventoryItemInput
): Promise<IInventoryDocument | null> {
  return InventoryItemModel.findOneAndUpdate({ _id: id, orgId }, data, { new: true }).exec();
}

export async function deleteInventoryItem(
  id: string,
  orgId: string
): Promise<IInventoryDocument | null> {
  return InventoryItemModel.findOneAndDelete({ _id: id, orgId }).exec();
}
