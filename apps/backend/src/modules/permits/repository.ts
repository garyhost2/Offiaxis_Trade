import mongoose, { Document, Schema } from 'mongoose';
import { Permit, PermitStatus } from './types';
import { CreatePermitInput, UpdatePermitInput } from './schema';

interface IPermitDocument extends Omit<Permit, 'createdAt' | 'updatedAt'>, Document {}

const permitSchema = new Schema<IPermitDocument>(
  {
    orgId: { type: String, required: true },
    projectId: { type: String, required: true },
    permitNumber: { type: String },
    issueDate: { type: Date },
    expirationDate: { type: Date },
    fees: { type: Number },
    imageUrl: { type: String },
    extractedData: { type: Schema.Types.Mixed },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'active', 'expired'] as PermitStatus[],
      default: 'pending',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

permitSchema.index({ orgId: 1 });
permitSchema.index({ orgId: 1, createdAt: -1 });

export const PermitModel = mongoose.model<IPermitDocument>('Permit', permitSchema);

export async function createPermit(
  orgId: string,
  createdBy: string,
  data: CreatePermitInput
): Promise<IPermitDocument> {
  return PermitModel.create({ ...data, orgId, createdBy });
}

export async function findPermitById(
  id: string,
  orgId: string
): Promise<IPermitDocument | null> {
  return PermitModel.findOne({ _id: id, orgId }).exec();
}

export async function listPermits(params: {
  orgId: string;
  projectId?: string;
}): Promise<IPermitDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.projectId) query['projectId'] = params.projectId;
  return PermitModel.find(query).sort({ createdAt: -1 }).exec();
}

export async function updatePermit(
  id: string,
  orgId: string,
  data: UpdatePermitInput & { extractedData?: Record<string, unknown> }
): Promise<IPermitDocument | null> {
  return PermitModel.findOneAndUpdate({ _id: id, orgId }, data, { new: true }).exec();
}

export async function deletePermit(
  id: string,
  orgId: string
): Promise<IPermitDocument | null> {
  return PermitModel.findOneAndDelete({ _id: id, orgId }).exec();
}
