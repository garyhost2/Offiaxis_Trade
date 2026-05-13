import { z } from 'zod';

export const TrackerStatusSchema = z.enum(['active', 'on_break', 'completed', 'pending_review']);

export const ClockInSchema = z.object({
  projectId: z.string().optional(),
  note: z.string().max(500).optional(),
});

export const ClockOutSchema = z.object({
  note: z.string().max(500).optional(),
});

export const ManualEntrySchema = z.object({
  projectId: z.string().optional(),
  clockIn: z.coerce.date(),
  clockOut: z.coerce.date(),
  note: z.string().max(500).optional(),
});

export const ReviewSessionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

export const TrackerSessionResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  userId: z.string(),
  projectId: z.string().optional(),
  clockIn: z.date(),
  clockOut: z.date().optional(),
  breakStart: z.date().optional(),
  breakEnd: z.date().optional(),
  status: TrackerStatusSchema,
  note: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  manualEntry: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PaginatedSessionsSchema = z.object({
  data: z.array(TrackerSessionResponseSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type ClockInInput = z.infer<typeof ClockInSchema>;
export type ManualEntryInput = z.infer<typeof ManualEntrySchema>;
export type ReviewSessionInput = z.infer<typeof ReviewSessionSchema>;
