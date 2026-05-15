import { z } from 'zod';

export const PermitStatusSchema = z.enum(['pending', 'active', 'expired']);

export const PermitSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  projectId: z.string(),
  permitNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
  fees: z.string().optional(),
  imageUrl: z.string().url().optional(),
  extractedData: z.record(z.string(), z.unknown()).optional(),
  status: PermitStatusSchema,
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type Permit = z.infer<typeof PermitSchema>;

export const CreatePermitSchema = PermitSchema.omit({ _id: true, orgId: true, createdBy: true, createdAt: true, updatedAt: true });
export const UpdatePermitSchema = CreatePermitSchema.partial();

export const ExtractPermitSchema = z.object({
  imageBase64: z.string().min(1),
});

export const ExtractPermitResponseSchema = z.object({
  permitNumber: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  fees: z.string().optional().nullable(),
  success: z.boolean(),
  error: z.string().optional().nullable(),
});
