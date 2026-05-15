import {
  createSession,
  findSessionById,
  findActiveSession,
  updateSession,
  listSessions,
} from './repository';
import { ClockInInput, ManualEntryInput, ReviewSessionInput } from './schema';
import { TrackerSession } from './types';
import { NotFoundError, ValidationError, ForbiddenError } from '../../shared/errors';
import mongoose from 'mongoose';

type SessionWithId = TrackerSession & { _id: string };

function toSession(doc: Record<string, unknown>): SessionWithId {
  return {
    _id: (doc['_id'] as mongoose.Types.ObjectId).toString(),
    orgId: doc['orgId'] as string,
    userId: doc['userId'] as string,
    projectId: doc['projectId'] as string | undefined,
    clockIn: doc['clockIn'] as Date,
    clockOut: doc['clockOut'] as Date | undefined,
    breakStart: doc['breakStart'] as Date | undefined,
    breakEnd: doc['breakEnd'] as Date | undefined,
    status: doc['status'] as TrackerSession['status'],
    note: doc['note'] as string | undefined,
    reviewedBy: doc['reviewedBy'] as string | undefined,
    reviewedAt: doc['reviewedAt'] as Date | undefined,
    manualEntry: doc['manualEntry'] as boolean,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

export async function clockIn(
  orgId: string,
  userId: string,
  input: ClockInInput
): Promise<SessionWithId> {
  const active = await findActiveSession(userId, orgId);
  if (active) {
    throw new ValidationError('You already have an active session');
  }

  const doc = await createSession({
    orgId,
    userId,
    projectId: input.projectId,
    clockIn: new Date(),
    status: 'active',
    note: input.note,
    manualEntry: false,
  });

  return toSession(doc as unknown as Record<string, unknown>);
}

export async function clockOut(
  sessionId: string,
  orgId: string,
  userId: string
): Promise<SessionWithId> {
  const session = await findSessionById(sessionId, orgId);
  if (!session) throw new NotFoundError('Session');
  if (session.userId !== userId) throw new ForbiddenError('Cannot clock out another user');
  if (session.status === 'completed') throw new ValidationError('Session already completed');

  const doc = await updateSession(sessionId, orgId, {
    clockOut: new Date(),
    status: 'pending_review',
  });

  if (!doc) throw new NotFoundError('Session');
  return toSession(doc as unknown as Record<string, unknown>);
}

export async function startBreak(
  sessionId: string,
  orgId: string,
  userId: string
): Promise<SessionWithId> {
  const session = await findSessionById(sessionId, orgId);
  if (!session) throw new NotFoundError('Session');
  if (session.userId !== userId) throw new ForbiddenError('Cannot modify another user\'s session');
  if (session.status !== 'active') throw new ValidationError('Session is not active');

  const doc = await updateSession(sessionId, orgId, {
    breakStart: new Date(),
    status: 'on_break',
  });
  if (!doc) throw new NotFoundError('Session');
  return toSession(doc as unknown as Record<string, unknown>);
}

export async function endBreak(
  sessionId: string,
  orgId: string,
  userId: string
): Promise<SessionWithId> {
  const session = await findSessionById(sessionId, orgId);
  if (!session) throw new NotFoundError('Session');
  if (session.userId !== userId) throw new ForbiddenError('Cannot modify another user\'s session');
  if (session.status !== 'on_break') throw new ValidationError('Session is not on break');

  const doc = await updateSession(sessionId, orgId, {
    breakEnd: new Date(),
    status: 'active',
  });
  if (!doc) throw new NotFoundError('Session');
  return toSession(doc as unknown as Record<string, unknown>);
}

export async function createManualEntry(
  orgId: string,
  userId: string,
  input: ManualEntryInput
): Promise<SessionWithId> {
  const doc = await createSession({
    orgId,
    userId,
    projectId: input.projectId,
    clockIn: input.clockIn,
    clockOut: input.clockOut,
    status: 'pending_review',
    note: input.note,
    manualEntry: true,
  });
  return toSession(doc as unknown as Record<string, unknown>);
}

export async function reviewSession(
  sessionId: string,
  orgId: string,
  reviewerUid: string,
  input: ReviewSessionInput
): Promise<SessionWithId> {
  const doc = await updateSession(sessionId, orgId, {
    status: input.action === 'approve' ? 'completed' : 'pending_review',
    reviewedBy: reviewerUid,
    reviewedAt: new Date(),
    note: input.note,
  });
  if (!doc) throw new NotFoundError('Session');
  return toSession(doc as unknown as Record<string, unknown>);
}

export async function listSessionsService(params: {
  orgId: string;
  userId?: string;
  cursor?: string;
  limit: number;
}): Promise<{ data: SessionWithId[]; nextCursor: string | null; hasMore: boolean }> {
  const docs = await listSessions(params);
  const hasMore = docs.length > params.limit;
  const slice = docs.slice(0, params.limit);
  const data = slice.map((doc) => toSession(doc as unknown as Record<string, unknown>));
  const nextCursor = hasMore ? data[data.length - 1]?._id ?? null : null;
  return { data, nextCursor, hasMore };
}

export async function getSessionService(
  sessionId: string,
  orgId: string
): Promise<SessionWithId> {
  const doc = await findSessionById(sessionId, orgId);
  if (!doc) throw new NotFoundError('Session');
  return toSession(doc as unknown as Record<string, unknown>);
}
