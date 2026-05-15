import { z } from 'zod';

export const ProjectStatusSchema = z.enum(['Rough-In', 'To be scheduled', 'Inspection', 'Completed', 'Final Trim']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const OtherContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  note: z.string().optional(),
});

export const ProjectSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  name: z.string().min(1),
  clientName: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  permit: z.string().optional(),
  status: ProjectStatusSchema,
  initials: z.string().optional(),
  otherContacts: z.array(OtherContactSchema).default([]),
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = ProjectSchema.omit({ _id: true, orgId: true, createdBy: true, createdAt: true, updatedAt: true });
export const UpdateProjectSchema = CreateProjectSchema.partial();

export const PaginatedProjectsSchema = z.object({
  data: z.array(ProjectSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});
