import { z } from 'zod';

export const ScheduleEventTypeSchema = z.enum(['job', 'inspection', 'meeting', 'other']);
export const ScheduleEventStatusSchema = z.enum(['scheduled', 'completed', 'cancelled']);

export const CreateScheduleEventSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  allDay: z.boolean().default(false),
  assignedTo: z.array(z.string()).default([]),
  type: ScheduleEventTypeSchema,
  status: ScheduleEventStatusSchema.default('scheduled'),
});

export const UpdateScheduleEventSchema = CreateScheduleEventSchema.partial();

export const ScheduleEventResponseSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  projectId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  allDay: z.boolean(),
  assignedTo: z.array(z.string()),
  type: ScheduleEventTypeSchema,
  status: ScheduleEventStatusSchema,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateScheduleEventInput = z.infer<typeof CreateScheduleEventSchema>;
export type UpdateScheduleEventInput = z.infer<typeof UpdateScheduleEventSchema>;
