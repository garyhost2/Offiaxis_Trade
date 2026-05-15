import mongoose, { Document, Schema } from 'mongoose';
import { Project, ProjectStatus, OtherContact } from './types';
import { CreateProjectInput, UpdateProjectInput } from './schema';

interface IProjectDocument extends Omit<Project, 'createdAt' | 'updatedAt'>, Document {}

const otherContactSchema = new Schema<OtherContact>(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
  },
  { _id: false }
);

const projectSchema = new Schema<IProjectDocument>(
  {
    orgId: { type: String, required: true },
    name: { type: String, required: true },
    clientName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    permit: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['Rough-In', 'To be scheduled', 'Inspection', 'Completed', 'Final Trim'] as ProjectStatus[],
      default: 'To be scheduled',
    },
    initials: { type: String, required: true },
    otherContacts: { type: [otherContactSchema], default: [] },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

projectSchema.index({ orgId: 1 });
projectSchema.index({ orgId: 1, createdAt: -1 });
projectSchema.index({ orgId: 1, status: 1 });

export const ProjectModel = mongoose.model<IProjectDocument>('Project', projectSchema);

export async function createProject(
  orgId: string,
  createdBy: string,
  data: CreateProjectInput
): Promise<IProjectDocument> {
  return ProjectModel.create({ ...data, orgId, createdBy });
}

export async function findProjectById(
  id: string,
  orgId: string
): Promise<IProjectDocument | null> {
  return ProjectModel.findOne({ _id: id, orgId }).exec();
}

export async function listProjects(params: {
  orgId: string;
  cursor?: string;
  limit: number;
  status?: ProjectStatus;
}): Promise<IProjectDocument[]> {
  const query: Record<string, unknown> = { orgId: params.orgId };
  if (params.status) query['status'] = params.status;
  if (params.cursor) {
    query['_id'] = { $gt: new mongoose.Types.ObjectId(params.cursor) };
  }
  return ProjectModel.find(query).sort({ _id: 1 }).limit(params.limit + 1).exec();
}

export async function updateProject(
  id: string,
  orgId: string,
  data: UpdateProjectInput
): Promise<IProjectDocument | null> {
  return ProjectModel.findOneAndUpdate({ _id: id, orgId }, data, { new: true }).exec();
}

export async function deleteProject(
  id: string,
  orgId: string
): Promise<IProjectDocument | null> {
  return ProjectModel.findOneAndDelete({ _id: id, orgId }).exec();
}
