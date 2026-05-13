import { RegisterUserInput, UpdateRoleInput } from './schema';
import {
  findUserByUid,
  upsertUser,
  updateUserRole,
} from './repository';
import { User } from './types';
import { NotFoundError } from '../../shared/errors';

export async function registerOrUpdateUser(
  input: RegisterUserInput
): Promise<User> {
  const doc = await upsertUser({
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    orgId: input.orgId,
    fcmToken: input.fcmToken,
  });

  return {
    uid: doc.uid,
    email: doc.email,
    displayName: doc.displayName,
    role: doc.role,
    orgId: doc.orgId,
    fcmTokens: doc.fcmTokens,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getMe(uid: string): Promise<User> {
  const doc = await findUserByUid(uid);
  if (!doc) {
    throw new NotFoundError('User');
  }

  return {
    uid: doc.uid,
    email: doc.email,
    displayName: doc.displayName,
    role: doc.role,
    orgId: doc.orgId,
    fcmTokens: doc.fcmTokens,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function changeUserRole(
  input: UpdateRoleInput,
  callerOrgId: string
): Promise<User> {
  const doc = await updateUserRole(input.uid, callerOrgId, input.role);
  if (!doc) {
    throw new NotFoundError('User');
  }

  return {
    uid: doc.uid,
    email: doc.email,
    displayName: doc.displayName,
    role: doc.role,
    orgId: doc.orgId,
    fcmTokens: doc.fcmTokens,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
