import { z } from 'zod';

export const EventTypeSchema = z.enum(['job', 'inspection', 'meeting', 'other']);
export const EventStatusSchema = z.enum(['scheduled', 'completed', 'cancelled']);

export const ScheduleEventSchema = z.object({
  _id: z.string().optional(),
  orgId: z.string(),
  projectId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  allDay: z.boolean().default(false),
  assignedTo: z.array(z.string()).default([]),
  type: EventTypeSchema,
  status: EventStatusSchema,
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type ScheduleEvent = z.infer<typeof ScheduleEventSchema>;

export const CreateScheduleEventSchema = ScheduleEventSchema.omit({ _id: true, orgId: true, createdBy: true, createdAt: true, updatedAt: true });
export const UpdateScheduleEventSchema = CreateScheduleEventSchema.partial();
