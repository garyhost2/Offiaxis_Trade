import mongoose, { Document, Schema } from 'mongoose';
import { Receipt } from './types';
import { CreateReceiptInput, UpdateReceiptInput } from './schema';

interface IReceiptDocument extends Omit<Receipt, 'createdAt' | 'updatedAt'>, Document {}

const receiptSchema = new Schema<IReceiptDocument>(
  {
    orgId: { type: String, required: true },
    projectId: { type: String },
    vendor: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String },
    note: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

receiptSchema.index({ orgId: 1 });
receiptSchema.index({ orgId: 1, createdAt: -1 });

export const ReceiptModel = mongoose.model<IReceiptDocument>('Receipt', receiptSchema);

export async function createReceipt(
  orgId: string,
  createdBy: string,
  data: CreateReceiptInput
): Promise<IReceiptDocument> {
  return ReceiptModel.create({ ...data, orgId, createdBy });
}

export async function findReceiptById(
  id: string,
  orgId: string
): Promise<IReceiptDocument | null> {
  return ReceiptModel.findOne({ _id: id, orgId }).exec();
}

export async function listReceipts(params: {
  orgId: string;
  projectId?: string;
  cursor?: string;
  limit: number;
}): Promise<IReceiptDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.projectId) query['projectId'] = params.projectId;
  if (params.cursor) query['_id'] = { $gt: new mongoose.Types.ObjectId(params.cursor) };
  return ReceiptModel.find(query).sort({ _id: 1 }).limit(params.limit + 1).exec();
}

export async function updateReceipt(
  id: string,
  orgId: string,
  data: UpdateReceiptInput
): Promise<IReceiptDocument | null> {
  return ReceiptModel.findOneAndUpdate({ _id: id, orgId }, data, { new: true }).exec();
}

export async function deleteReceipt(
  id: string,
  orgId: string
): Promise<IReceiptDocument | null> {
  return ReceiptModel.findOneAndDelete({ _id: id, orgId }).exec();
}
