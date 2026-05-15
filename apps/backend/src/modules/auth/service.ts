import { RegisterUserInput, UpdateRoleInput, SignUpInput, SignInInput } from './schema';
import {
  findUserByUid,
  upsertUser,
  updateUserRole,
} from './repository';
import { User, UserRole } from './types';
import { NotFoundError, AppError } from '../../shared/errors';
import { auth as firebaseAuth } from '../../core/firebase';
import { config } from '../../core/config';

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

export interface SignInResult {
  uid: string;
  email: string;
  displayName: string;
  token: string;
  tokenExpiry: number;
  orgId: string | null;
  role: UserRole | null;
}

export async function signUpUser(input: SignUpInput): Promise<SignInResult> {
  // Create user in Firebase
  const firebaseUser = await firebaseAuth.createUser({
    email: input.email,
    password: input.password,
    displayName: input.displayName,
  });

  const orgId = input.orgId ?? firebaseUser.uid; // default orgId to uid for new owners

  // Create MongoDB profile
  await upsertUser({
    uid: firebaseUser.uid,
    email: input.email,
    displayName: input.displayName,
    role: input.role ?? 'viewer',
    orgId,
  });

  // Create custom token
  const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid);
  const tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

  return {
    uid: firebaseUser.uid,
    email: input.email,
    displayName: input.displayName,
    token: customToken,
    tokenExpiry,
    orgId,
    role: input.role ?? 'viewer',
  };
}

export async function signInUser(input: SignInInput): Promise<SignInResult> {
  // Use Firebase REST API to verify email/password
  const apiKey = config.FIREBASE_WEB_API_KEY;
  const restUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  const response = await fetch(restUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const body = await response.json() as { error?: { message?: string } };
    const msg = body.error?.message ?? 'Invalid credentials';
    const userMsg = (msg === 'EMAIL_NOT_FOUND' || msg === 'INVALID_PASSWORD' || msg === 'INVALID_LOGIN_CREDENTIALS')
      ? 'Invalid email or password'
      : msg;
    throw new AppError(userMsg, 401, 'INVALID_CREDENTIALS');
  }

  const data = await response.json() as { localId: string; idToken: string; expiresIn: string };
  const uid = data.localId;

  // Fetch MongoDB profile for role/orgId
  const doc = await findUserByUid(uid);

  // Create a custom token so the client can re-auth with Firebase SDK
  const customToken = await firebaseAuth.createCustomToken(uid);
  const tokenExpiry = Date.now() + parseInt(data.expiresIn, 10) * 1000;

  return {
    uid,
    email: input.email,
    displayName: doc?.displayName ?? input.email,
    token: customToken,
    tokenExpiry,
    orgId: doc?.orgId ?? null,
    role: doc?.role ?? null,
  };
}
