import { z } from 'zod';

export const UserRoleSchema = z.enum(['owner', 'admin', 'project_manager', 'field_worker', 'subcontractor', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: UserRoleSchema,
  orgId: z.string(),
  fcmTokens: z.array(z.string()).default([]),
});
export type User = z.infer<typeof UserSchema>;

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  role: UserRoleSchema.optional().default('viewer'),
  orgId: z.string().optional(),
});

export const UpdateRoleSchema = z.object({
  uid: z.string(),
  role: UserRoleSchema,
});
