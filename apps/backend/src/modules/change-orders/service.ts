import {
  createChangeOrder,
  findChangeOrderById,
  listChangeOrders,
  updateChangeOrderStatus,
  deleteChangeOrder,
} from './repository';
import { CreateChangeOrderInput, UpdateChangeOrderInput } from './schema';
import { ChangeOrder } from './types';
import { NotFoundError } from '../../shared/errors';
import mongoose from 'mongoose';

type ChangeOrderWithId = ChangeOrder & { _id: string };

function toChangeOrder(doc: Record<string, unknown>): ChangeOrderWithId {
  return {
    _id: (doc['_id'] as mongoose.Types.ObjectId).toString(),
    orgId: doc['orgId'] as string,
    projectId: doc['projectId'] as string,
    title: doc['title'] as string,
    description: doc['description'] as string | undefined,
    amount: doc['amount'] as number,
    date: doc['date'] as Date,
    status: doc['status'] as ChangeOrder['status'],
    type: doc['type'] as ChangeOrder['type'],
    requestedBy: doc['requestedBy'] as string,
    fileUrl: doc['fileUrl'] as string | undefined,
    statusLog: doc['statusLog'] as ChangeOrder['statusLog'],
    paymentStatusLog: doc['paymentStatusLog'] as ChangeOrder['paymentStatusLog'],
    createdBy: doc['createdBy'] as string,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

export async function createChangeOrderService(
  orgId: string,
  createdBy: string,
  data: CreateChangeOrderInput
): Promise<ChangeOrderWithId> {
  const doc = await createChangeOrder(orgId, createdBy, data);
  return toChangeOrder(doc as unknown as Record<string, unknown>);
}

export async function getChangeOrderService(
  id: string,
  orgId: string
): Promise<ChangeOrderWithId> {
  const doc = await findChangeOrderById(id, orgId);
  if (!doc) throw new NotFoundError('ChangeOrder');
  return toChangeOrder(doc as unknown as Record<string, unknown>);
}

export async function listChangeOrdersService(params: {
  orgId: string;
  projectId?: string;
  cursor?: string;
  limit: number;
}): Promise<{ data: ChangeOrderWithId[]; nextCursor: string | null; hasMore: boolean }> {
  const docs = await listChangeOrders(params);
  const hasMore = docs.length > params.limit;
  const slice = docs.slice(0, params.limit);
  const data = slice.map((doc) => toChangeOrder(doc as unknown as Record<string, unknown>));
  const nextCursor = hasMore ? data[data.length - 1]?._id ?? null : null;
  return { data, nextCursor, hasMore };
}

export async function updateChangeOrderService(
  id: string,
  orgId: string,
  changedBy: string,
  data: UpdateChangeOrderInput
): Promise<ChangeOrderWithId> {
  const doc = await updateChangeOrderStatus(id, orgId, changedBy, data);
  if (!doc) throw new NotFoundError('ChangeOrder');
  return toChangeOrder(doc as unknown as Record<string, unknown>);
}

export async function deleteChangeOrderService(
  id: string,
  orgId: string
): Promise<void> {
  const doc = await deleteChangeOrder(id, orgId);
  if (!doc) throw new NotFoundError('ChangeOrder');
}
