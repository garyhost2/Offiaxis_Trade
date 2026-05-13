import {
  createScheduleEvent,
  findScheduleEventById,
  listScheduleEvents,
  updateScheduleEvent,
  deleteScheduleEvent,
} from './repository';
import { CreateScheduleEventInput, UpdateScheduleEventInput } from './schema';
import { ScheduleEvent } from './types';
import { NotFoundError } from '../../shared/errors';
import mongoose from 'mongoose';

type EventWithId = ScheduleEvent & { _id: string };

function toEvent(doc: Record<string, unknown>): EventWithId {
  return {
    _id: (doc['_id'] as mongoose.Types.ObjectId).toString(),
    orgId: doc['orgId'] as string,
    projectId: doc['projectId'] as string | undefined,
    title: doc['title'] as string,
    description: doc['description'] as string | undefined,
    startDate: doc['startDate'] as Date,
    endDate: doc['endDate'] as Date | undefined,
    allDay: doc['allDay'] as boolean,
    assignedTo: doc['assignedTo'] as string[],
    type: doc['type'] as ScheduleEvent['type'],
    status: doc['status'] as ScheduleEvent['status'],
    createdBy: doc['createdBy'] as string,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

export async function createScheduleEventService(
  orgId: string,
  createdBy: string,
  data: CreateScheduleEventInput
): Promise<EventWithId> {
  const doc = await createScheduleEvent(orgId, createdBy, data);
  return toEvent(doc as unknown as Record<string, unknown>);
}

export async function getScheduleEventService(
  id: string,
  orgId: string
): Promise<EventWithId> {
  const doc = await findScheduleEventById(id, orgId);
  if (!doc) throw new NotFoundError('ScheduleEvent');
  return toEvent(doc as unknown as Record<string, unknown>);
}

export async function listScheduleEventsService(params: {
  orgId: string;
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
}): Promise<EventWithId[]> {
  const docs = await listScheduleEvents(params);
  return docs.map((doc) => toEvent(doc as unknown as Record<string, unknown>));
}

export async function updateScheduleEventService(
  id: string,
  orgId: string,
  data: UpdateScheduleEventInput
): Promise<EventWithId> {
  const doc = await updateScheduleEvent(id, orgId, data);
  if (!doc) throw new NotFoundError('ScheduleEvent');
  return toEvent(doc as unknown as Record<string, unknown>);
}

export async function deleteScheduleEventService(
  id: string,
  orgId: string
): Promise<void> {
  const doc = await deleteScheduleEvent(id, orgId);
  if (!doc) throw new NotFoundError('ScheduleEvent');
}
