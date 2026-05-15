import mongoose, { Document, Schema } from 'mongoose';
import {
  ChangeOrder,
  ChangeOrderStatus,
  ChangeOrderType,
  StatusLogEntry,
  PaymentStatusLogEntry,
} from './types';
import { CreateChangeOrderInput, UpdateChangeOrderInput } from './schema';

interface IChangeOrderDocument extends Omit<ChangeOrder, 'createdAt' | 'updatedAt'>, Document {}

const statusLogSchema = new Schema<StatusLogEntry>(
  {
    status: { type: String, required: true },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, required: true },
    note: { type: String },
  },
  { _id: false }
);

const paymentStatusLogSchema = new Schema<PaymentStatusLogEntry>(
  {
    status: { type: String, required: true },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, required: true },
    note: { type: String },
  },
  { _id: false }
);

const changeOrderSchema = new Schema<IChangeOrderDocument>(
  {
    orgId: { type: String, required: true },
    projectId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Submitted', 'In Review', 'Approved', 'Rejected', 'On Hold'] as ChangeOrderStatus[],
      default: 'Submitted',
    },
    type: {
      type: String,
      required: true,
      enum: ['Invoice', 'Change Order', 'Modification'] as ChangeOrderType[],
    },
    requestedBy: { type: String, required: true },
    fileUrl: { type: String },
    statusLog: { type: [statusLogSchema], default: [] },
    paymentStatusLog: { type: [paymentStatusLogSchema], default: [] },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

changeOrderSchema.index({ orgId: 1 });
changeOrderSchema.index({ orgId: 1, createdAt: -1 });
changeOrderSchema.index({ orgId: 1, status: 1 });

export const ChangeOrderModel = mongoose.model<IChangeOrderDocument>(
  'ChangeOrder',
  changeOrderSchema
);

export async function createChangeOrder(
  orgId: string,
  createdBy: string,
  data: CreateChangeOrderInput
): Promise<IChangeOrderDocument> {
  const statusEntry: StatusLogEntry = {
    status: data.status,
    changedBy: createdBy,
    changedAt: new Date(),
  };
  return ChangeOrderModel.create({
    ...data,
    orgId,
    createdBy,
    statusLog: [statusEntry],
    paymentStatusLog: [],
  });
}

export async function findChangeOrderById(
  id: string,
  orgId: string
): Promise<IChangeOrderDocument | null> {
  return ChangeOrderModel.findOne({ _id: id, orgId }).exec();
}

export async function listChangeOrders(params: {
  orgId: string;
  projectId?: string;
  cursor?: string;
  limit: number;
}): Promise<IChangeOrderDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.projectId) query['projectId'] = params.projectId;
  if (params.cursor) query['_id'] = { $gt: new mongoose.Types.ObjectId(params.cursor) };
  return ChangeOrderModel.find(query).sort({ _id: 1 }).limit(params.limit + 1).exec();
}

export async function updateChangeOrderStatus(
  id: string,
  orgId: string,
  changedBy: string,
  data: UpdateChangeOrderInput
): Promise<IChangeOrderDocument | null> {
  const update: Record<string, unknown> = {};

  if (data.title !== undefined) update['title'] = data.title;
  if (data.description !== undefined) update['description'] = data.description;
  if (data.amount !== undefined) update['amount'] = data.amount;
  if (data.date !== undefined) update['date'] = data.date;
  if (data.fileUrl !== undefined) update['fileUrl'] = data.fileUrl;

  if (data.status !== undefined) {
    update['status'] = data.status;
    const logEntry: StatusLogEntry = {
      status: data.status,
      changedBy,
      changedAt: new Date(),
      note: data.note,
    };
    return ChangeOrderModel.findOneAndUpdate(
      { _id: id, orgId },
      { $set: update, $push: { statusLog: logEntry } },
      { new: true }
    ).exec();
  }

  return ChangeOrderModel.findOneAndUpdate({ _id: id, orgId }, { $set: update }, { new: true }).exec();
}

export async function deleteChangeOrder(
  id: string,
  orgId: string
): Promise<IChangeOrderDocument | null> {
  return ChangeOrderModel.findOneAndDelete({ _id: id, orgId }).exec();
}
