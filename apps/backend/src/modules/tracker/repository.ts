import mongoose, { Document, Schema } from 'mongoose';
import { TrackerSession, TrackerStatus } from './types';

interface ITrackerDocument extends Omit<TrackerSession, 'createdAt' | 'updatedAt'>, Document {}

const trackerSchema = new Schema<ITrackerDocument>(
  {
    orgId: { type: String, required: true },
    userId: { type: String, required: true },
    projectId: { type: String },
    clockIn: { type: Date, required: true },
    clockOut: { type: Date },
    breakStart: { type: Date },
    breakEnd: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ['active', 'on_break', 'completed', 'pending_review'] as TrackerStatus[],
      default: 'active',
    },
    note: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    manualEntry: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

trackerSchema.index({ orgId: 1 });
trackerSchema.index({ orgId: 1, createdAt: -1 });
trackerSchema.index({ orgId: 1, userId: 1 });
trackerSchema.index({ orgId: 1, status: 1 });

export const TrackerSessionModel = mongoose.model<ITrackerDocument>('TrackerSession', trackerSchema);

export async function createSession(data: {
  orgId: string;
  userId: string;
  projectId?: string;
  clockIn: Date;
  clockOut?: Date;
  status: TrackerStatus;
  note?: string;
  manualEntry: boolean;
}): Promise<ITrackerDocument> {
  return TrackerSessionModel.create(data);
}

export async function findSessionById(
  id: string,
  orgId: string
): Promise<ITrackerDocument | null> {
  return TrackerSessionModel.findOne({ _id: id, orgId }).exec();
}

export async function findActiveSession(
  userId: string,
  orgId: string
): Promise<ITrackerDocument | null> {
  return TrackerSessionModel.findOne({ userId, orgId, status: { $in: ['active', 'on_break'] } }).exec();
}

export async function updateSession(
  id: string,
  orgId: string,
  data: Partial<TrackerSession>
): Promise<ITrackerDocument | null> {
  return TrackerSessionModel.findOneAndUpdate({ _id: id, orgId }, data, { new: true }).exec();
}

export async function listSessions(params: {
  orgId: string;
  userId?: string;
  cursor?: string;
  limit: number;
}): Promise<ITrackerDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.userId) query['userId'] = params.userId;
  if (params.cursor) query['_id'] = { $gt: new mongoose.Types.ObjectId(params.cursor) };
  return TrackerSessionModel.find(query).sort({ _id: 1 }).limit(params.limit + 1).exec();
}
