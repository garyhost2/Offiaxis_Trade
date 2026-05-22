import { z } from 'zod';

export const SiteNotesRequestSchema = z.object({
  images: z.array(z.string()).default([]),
  voiceNotes: z.array(z.string()).default([]),
  projectContext: z.string().optional(),
});

export const PunchListItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  location: z.string().optional().nullable(),
  priority: z.enum(['High', 'Medium', 'Low']),
  status: z.string(),
});

export const ChecklistItemSchema = z.object({
  id: z.string(),
  task: z.string(),
  category: z.string(),
  checked: z.boolean(),
});

export const MaterialItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.string(),
  category: z.string(),
  notes: z.string().optional().nullable(),
});

export const SiteNotesResponseSchema = z.object({
  success: z.boolean(),
  punchList: z.array(PunchListItemSchema).default([]),
  checklist: z.array(ChecklistItemSchema).default([]),
  materialList: z.array(MaterialItemSchema).default([]),
  error: z.string().nullable().optional(),
});

export type SiteNotesRequest = z.infer<typeof SiteNotesRequestSchema>;
export type SiteNotesResponse = z.infer<typeof SiteNotesResponseSchema>;