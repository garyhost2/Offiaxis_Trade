import {
  createProject,
  findProjectById,
  listProjects,
  updateProject,
  deleteProject,
} from './repository';
import { CreateProjectInput, UpdateProjectInput } from './schema';
import { Project, ProjectStatus } from './types';
import { NotFoundError } from '../../shared/errors';
import mongoose from 'mongoose';

type ProjectWithId = Project & { _id: string };

function toProject(doc: { _id: mongoose.Types.ObjectId } & Record<string, unknown>): ProjectWithId {
  return {
    _id: doc['_id'].toString(),
    orgId: doc['orgId'] as string,
    name: doc['name'] as string,
    clientName: doc['clientName'] as string,
    street: doc['street'] as string,
    city: doc['city'] as string,
    phone: doc['phone'] as string,
    permit: doc['permit'] as string | undefined,
    status: doc['status'] as ProjectStatus,
    initials: doc['initials'] as string,
    otherContacts: doc['otherContacts'] as Project['otherContacts'],
    createdBy: doc['createdBy'] as string,
    createdAt: doc['createdAt'] as Date,
    updatedAt: doc['updatedAt'] as Date,
  };
}

export async function createProjectService(
  orgId: string,
  createdBy: string,
  data: CreateProjectInput
): Promise<ProjectWithId> {
  const doc = await createProject(orgId, createdBy, data);
  return toProject(doc as unknown as { _id: mongoose.Types.ObjectId } & Record<string, unknown>);
}

export async function getProjectService(
  id: string,
  orgId: string
): Promise<ProjectWithId> {
  const doc = await findProjectById(id, orgId);
  if (!doc) throw new NotFoundError('Project');
  return toProject(doc as unknown as { _id: mongoose.Types.ObjectId } & Record<string, unknown>);
}

export async function listProjectsService(params: {
  orgId: string;
  cursor?: string;
  limit: number;
  status?: ProjectStatus;
}): Promise<{ data: ProjectWithId[]; nextCursor: string | null; hasMore: boolean }> {
  const docs = await listProjects(params);
  const hasMore = docs.length > params.limit;
  const slice = docs.slice(0, params.limit);
  const data = slice.map((doc) =>
    toProject(doc as unknown as { _id: mongoose.Types.ObjectId } & Record<string, unknown>)
  );
  const nextCursor = hasMore ? data[data.length - 1]?._id ?? null : null;
  return { data, nextCursor, hasMore };
}

export async function updateProjectService(
  id: string,
  orgId: string,
  data: UpdateProjectInput
): Promise<ProjectWithId> {
  const doc = await updateProject(id, orgId, data);
  if (!doc) throw new NotFoundError('Project');
  return toProject(doc as unknown as { _id: mongoose.Types.ObjectId } & Record<string, unknown>);
}

export async function deleteProjectService(
  id: string,
  orgId: string
): Promise<void> {
  const doc = await deleteProject(id, orgId);
  if (!doc) throw new NotFoundError('Project');
}
