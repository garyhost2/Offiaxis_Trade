import {
  createPermit,
  findPermitById,
  listPermits,
  updatePermit,
  deletePermit,
} from './repository';
import { CreatePermitInput, UpdatePermitInput } from './schema';
import { Permit } from './types';
import { NotFoundError } from '../../shared/errors';
import { config } from '../../core/config';
import log from '../../core/logger';
import mongoose from 'mongoose';

type PermitWithId = Permit & { _id: string };

function toPermit(doc: Record<string, unknown>): PermitWithId {
  return {
    _id: (doc['_id'] as mongoose.Types.ObjectId).toString(),
    orgId: doc['orgId'] as string,
    projectId: doc['projectId'] as string,
    permitNumber: doc['permitNumber'] as string | undefined,
    issueDate: doc['issueDate'] as Date | undefined,
    expirationDate: doc['expirationDate'] as Date | undefined,
    fees: doc['fees'] as number | undefined,
    imageUrl: doc['imageUrl'] as string | undefined,
    extractedData: doc['extractedData'] as Record<string, unknown> | undefined,
    status: doc['status'] as Permit['status'],
    createdBy: doc['createdBy'] as string,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

export async function createPermitService(
  orgId: string,
  createdBy: string,
  data: CreatePermitInput
): Promise<PermitWithId> {
  const doc = await createPermit(orgId, createdBy, data);
  return toPermit(doc as unknown as Record<string, unknown>);
}

export async function getPermitService(
  id: string,
  orgId: string
): Promise<PermitWithId> {
  const doc = await findPermitById(id, orgId);
  if (!doc) throw new NotFoundError('Permit');
  return toPermit(doc as unknown as Record<string, unknown>);
}

export async function listPermitsService(params: {
  orgId: string;
  projectId?: string;
}): Promise<PermitWithId[]> {
  const docs = await listPermits(params);
  return docs.map((doc) => toPermit(doc as unknown as Record<string, unknown>));
}

export async function updatePermitService(
  id: string,
  orgId: string,
  data: UpdatePermitInput
): Promise<PermitWithId> {
  const doc = await updatePermit(id, orgId, data);
  if (!doc) throw new NotFoundError('Permit');
  return toPermit(doc as unknown as Record<string, unknown>);
}

export async function deletePermitService(
  id: string,
  orgId: string
): Promise<void> {
  const doc = await deletePermit(id, orgId);
  if (!doc) throw new NotFoundError('Permit');
}

export async function extractPermitData(
  imageUrl: string
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${config.AI_SERVICE_URL}/extract-permit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    if (!response.ok) {
      log.error('AI service extract-permit failed', {
        status: response.status.toString(),
      });
      return {};
    }

    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    log.error('AI service extract-permit error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}
