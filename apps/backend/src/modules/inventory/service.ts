import {
  createInventoryItem,
  findInventoryItemById,
  listInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
} from './repository';
import { CreateInventoryItemInput, UpdateInventoryItemInput } from './schema';
import { InventoryItem, InventoryStatus } from './types';
import { NotFoundError } from '../../shared/errors';
import mongoose from 'mongoose';

type InventoryWithId = InventoryItem & { _id: string };

function toInventory(doc: Record<string, unknown>): InventoryWithId {
  return {
    _id: (doc['_id'] as mongoose.Types.ObjectId).toString(),
    orgId: doc['orgId'] as string,
    name: doc['name'] as string,
    sku: doc['sku'] as string | undefined,
    category: doc['category'] as string,
    quantity: doc['quantity'] as number,
    unit: doc['unit'] as string,
    unitCost: doc['unitCost'] as number,
    location: doc['location'] as string | undefined,
    supplier: doc['supplier'] as string | undefined,
    status: doc['status'] as InventoryStatus,
    createdBy: doc['createdBy'] as string,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

export async function createInventoryItemService(
  orgId: string,
  createdBy: string,
  data: CreateInventoryItemInput
): Promise<InventoryWithId> {
  const doc = await createInventoryItem(orgId, createdBy, data);
  return toInventory(doc as unknown as Record<string, unknown>);
}

export async function getInventoryItemService(
  id: string,
  orgId: string
): Promise<InventoryWithId> {
  const doc = await findInventoryItemById(id, orgId);
  if (!doc) throw new NotFoundError('InventoryItem');
  return toInventory(doc as unknown as Record<string, unknown>);
}

export async function listInventoryService(params: {
  orgId: string;
  cursor?: string;
  limit: number;
  status?: InventoryStatus;
}): Promise<{ data: InventoryWithId[]; nextCursor: string | null; hasMore: boolean }> {
  const docs = await listInventoryItems(params);
  const hasMore = docs.length > params.limit;
  const slice = docs.slice(0, params.limit);
  const data = slice.map((doc) => toInventory(doc as unknown as Record<string, unknown>));
  const nextCursor = hasMore ? data[data.length - 1]?._id ?? null : null;
  return { data, nextCursor, hasMore };
}

export async function updateInventoryItemService(
  id: string,
  orgId: string,
  data: UpdateInventoryItemInput
): Promise<InventoryWithId> {
  const doc = await updateInventoryItem(id, orgId, data);
  if (!doc) throw new NotFoundError('InventoryItem');
  return toInventory(doc as unknown as Record<string, unknown>);
}

export async function deleteInventoryItemService(
  id: string,
  orgId: string
): Promise<void> {
  const doc = await deleteInventoryItem(id, orgId);
  if (!doc) throw new NotFoundError('InventoryItem');
}
