import { z } from 'zod';

export const UploadFolderSchema = z.enum([
  'projects',
  'permits',
  'receipts',
  'change-orders',
  'site-notes',
  'inventory',
  'knowledge-center',
]);

export const UploadAssetSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1).max(200).optional(),
  contentType: z.string().min(1).max(120).optional(),
  folder: UploadFolderSchema.default('projects'),
});

export const UploadAssetResponseSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
  resourceType: z.string(),
  bytes: z.number(),
  format: z.string().optional(),
});

export type UploadAssetInput = z.infer<typeof UploadAssetSchema>;
export type UploadAssetResponse = z.infer<typeof UploadAssetResponseSchema>;