import {
  createReceipt,
  findReceiptById,
  listReceipts,
  updateReceipt,
  deleteReceipt,
} from './repository';
import { CreateReceiptInput, UpdateReceiptInput } from './schema';
import { Receipt } from './types';
import { NotFoundError } from '../../shared/errors';
import mongoose from 'mongoose';

type ReceiptWithId = Receipt & { _id: string };

function toReceipt(doc: Record<string, unknown>): ReceiptWithId {
  return {
    _id: (doc['_id'] as mongoose.Types.ObjectId).toString(),
    orgId: doc['orgId'] as string,
    projectId: doc['projectId'] as string | undefined,
    vendor: doc['vendor'] as string,
    amount: doc['amount'] as number,
    date: doc['date'] as Date,
    category: doc['category'] as string,
    imageUrl: doc['imageUrl'] as string | undefined,
    note: doc['note'] as string | undefined,
    createdBy: doc['createdBy'] as string,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

export async function createReceiptService(
  orgId: string,
  createdBy: string,
  data: CreateReceiptInput
): Promise<ReceiptWithId> {
  const doc = await createReceipt(orgId, createdBy, data);
  return toReceipt(doc as unknown as Record<string, unknown>);
}

export async function getReceiptService(
  id: string,
  orgId: string
): Promise<ReceiptWithId> {
  const doc = await findReceiptById(id, orgId);
  if (!doc) throw new NotFoundError('Receipt');
  return toReceipt(doc as unknown as Record<string, unknown>);
}

export async function listReceiptsService(params: {
  orgId: string;
  projectId?: string;
  cursor?: string;
  limit: number;
}): Promise<{ data: ReceiptWithId[]; nextCursor: string | null; hasMore: boolean }> {
  const docs = await listReceipts(params);
  const hasMore = docs.length > params.limit;
  const slice = docs.slice(0, params.limit);
  const data = slice.map((doc) => toReceipt(doc as unknown as Record<string, unknown>));
  const nextCursor = hasMore ? data[data.length - 1]?._id ?? null : null;
  return { data, nextCursor, hasMore };
}

export async function updateReceiptService(
  id: string,
  orgId: string,
  data: UpdateReceiptInput
): Promise<ReceiptWithId> {
  const doc = await updateReceipt(id, orgId, data);
  if (!doc) throw new NotFoundError('Receipt');
  return toReceipt(doc as unknown as Record<string, unknown>);
}

export async function deleteReceiptService(
  id: string,
  orgId: string
): Promise<void> {
  const doc = await deleteReceipt(id, orgId);
  if (!doc) throw new NotFoundError('Receipt');
}
