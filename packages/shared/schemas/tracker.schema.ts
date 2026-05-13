import { z } from 'zod';

export const TrackerStatusSchema = z.enum(['active', 'on_break', 'completed', 'pending_review']);
export type TrackerStatus = z.infer<typeof TrackerStatusSchema>;

export const TrackerSessionSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  userId: z.string(),
  projectId: z.string().optional(),
  clockIn: z.coerce.date(),
  clockOut: z.coerce.date().optional(),
  breakStart: z.coerce.date().optional(),
  breakEnd: z.coerce.date().optional(),
  status: TrackerStatusSchema,
  note: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.coerce.date().optional(),
  manualEntry: z.boolean().default(false),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type TrackerSession = z.infer<typeof TrackerSessionSchema>;

export const ClockInSchema = z.object({
  projectId: z.string().optional(),
  note: z.string().optional(),
});

export const ManualEntrySchema = z.object({
  projectId: z.string().optional(),
  clockIn: z.coerce.date(),
  clockOut: z.coerce.date(),
  note: z.string().optional(),
});

export const ReviewSchema = z.object({
  approved: z.boolean(),
  note: z.string().optional(),
});
