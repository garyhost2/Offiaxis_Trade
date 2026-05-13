import mongoose, { Document, Schema } from 'mongoose';
import { ScheduleEvent, ScheduleEventType, ScheduleEventStatus } from './types';
import { CreateScheduleEventInput, UpdateScheduleEventInput } from './schema';

interface IScheduleEventDocument extends Omit<ScheduleEvent, 'createdAt' | 'updatedAt'>, Document {}

const scheduleSchema = new Schema<IScheduleEventDocument>(
  {
    orgId: { type: String, required: true },
    projectId: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    allDay: { type: Boolean, required: true, default: false },
    assignedTo: { type: [String], default: [] },
    type: {
      type: String,
      required: true,
      enum: ['job', 'inspection', 'meeting', 'other'] as ScheduleEventType[],
    },
    status: {
      type: String,
      required: true,
      enum: ['scheduled', 'completed', 'cancelled'] as ScheduleEventStatus[],
      default: 'scheduled',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

scheduleSchema.index({ orgId: 1 });
scheduleSchema.index({ orgId: 1, createdAt: -1 });

export const ScheduleEventModel = mongoose.model<IScheduleEventDocument>(
  'ScheduleEvent',
  scheduleSchema
);

export async function createScheduleEvent(
  orgId: string,
  createdBy: string,
  data: CreateScheduleEventInput
): Promise<IScheduleEventDocument> {
  return ScheduleEventModel.create({ ...data, orgId, createdBy });
}

export async function findScheduleEventById(
  id: string,
  orgId: string
): Promise<IScheduleEventDocument | null> {
  return ScheduleEventModel.findOne({ _id: id, orgId }).exec();
}

export async function listScheduleEvents(params: {
  orgId: string;
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
}): Promise<IScheduleEventDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.projectId) query['projectId'] = params.projectId;
  if (params.startDate || params.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (params.startDate) dateFilter['$gte'] = params.startDate;
    if (params.endDate) dateFilter['$lte'] = params.endDate;
    query['startDate'] = dateFilter;
  }
  return ScheduleEventModel.find(query).sort({ startDate: 1 }).exec();
}

export async function updateScheduleEvent(
  id: string,
  orgId: string,
  data: UpdateScheduleEventInput
): Promise<IScheduleEventDocument | null> {
  return ScheduleEventModel.findOneAndUpdate({ _id: id, orgId }, data, { new: true }).exec();
}

export async function deleteScheduleEvent(
  id: string,
  orgId: string
): Promise<IScheduleEventDocument | null> {
  return ScheduleEventModel.findOneAndDelete({ _id: id, orgId }).exec();
}
