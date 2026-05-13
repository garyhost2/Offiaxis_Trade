import { z } from 'zod';

export const ProjectStatusSchema = z.enum([
  'Rough-In',
  'To be scheduled',
  'Inspection',
  'Completed',
  'Final Trim',
]);

export const OtherContactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  clientName: z.string().min(1).max(200),
  street: z.string().min(1).max(300),
  city: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  permit: z.string().optional(),
  status: ProjectStatusSchema.default('To be scheduled'),
  initials: z.string().min(1).max(10),
  otherContacts: z.array(OtherContactSchema).default([]),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const ProjectResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  name: z.string(),
  clientName: z.string(),
  street: z.string(),
  city: z.string(),
  phone: z.string(),
  permit: z.string().optional(),
  status: ProjectStatusSchema,
  initials: z.string(),
  otherContacts: z.array(OtherContactSchema),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PaginatedProjectsSchema = z.object({
  data: z.array(ProjectResponseSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
