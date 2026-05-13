import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'owner',
  'admin',
  'project_manager',
  'field_worker',
  'subcontractor',
  'viewer',
]);

export const RegisterUserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  orgId: z.string().min(1),
  role: UserRoleSchema.optional().default('viewer'),
  fcmToken: z.string().optional(),
});

export const UpdateRoleSchema = z.object({
  uid: z.string().min(1),
  role: UserRoleSchema,
});

export const UserResponseSchema = z.object({
  uid: z.string(),
  email: z.string(),
  displayName: z.string(),
  role: UserRoleSchema,
  orgId: z.string(),
  fcmTokens: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
