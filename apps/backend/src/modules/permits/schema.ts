import { z } from 'zod';

export const PermitStatusSchema = z.enum(['pending', 'active', 'expired']);

export const CreatePermitSchema = z.object({
  projectId: z.string().min(1),
  permitNumber: z.string().optional(),
  issueDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  fees: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  status: PermitStatusSchema.default('pending'),
});

export const UpdatePermitSchema = CreatePermitSchema.partial();

export const PermitResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  projectId: z.string(),
  permitNumber: z.string().optional(),
  issueDate: z.date().optional(),
  expirationDate: z.date().optional(),
  fees: z.number().optional(),
  imageUrl: z.string().optional(),
  extractedData: z.record(z.string(), z.unknown()).optional(),
  status: PermitStatusSchema,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ExtractPermitSchema = z.object({
  imageBase64: z.string().min(1),
});

export const ExtractPermitResponseSchema = z.object({
  permitNumber: z.string().nullable().optional(),
  issueDate: z.string().nullable().optional(),
  expirationDate: z.string().nullable().optional(),
  fees: z.string().nullable().optional(),
  success: z.boolean(),
  error: z.string().nullable().optional(),
});

export type CreatePermitInput = z.infer<typeof CreatePermitSchema>;
export type UpdatePermitInput = z.infer<typeof UpdatePermitSchema>;
export type ExtractPermitInput = z.infer<typeof ExtractPermitSchema>;
export type ExtractPermitResponse = z.infer<typeof ExtractPermitResponseSchema>;
