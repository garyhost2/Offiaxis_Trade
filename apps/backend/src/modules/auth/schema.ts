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

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100),
  role: UserRoleSchema.optional().default('viewer'),
  orgId: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const SignInResponseSchema = z.object({
  uid: z.string(),
  email: z.string(),
  displayName: z.string(),
  token: z.string(),
  tokenExpiry: z.number(),
  orgId: z.string().nullable(),
  role: UserRoleSchema.nullable(),
});

export const GoogleSignInSchema = z.object({
  idToken: z.string().optional(),
  accessToken: z.string().optional(),
}).refine(
  (data) => Boolean(data.idToken) || Boolean(data.accessToken),
  { message: 'Either idToken or accessToken is required' }
);

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type GoogleSignInInput = z.infer<typeof GoogleSignInSchema>;
