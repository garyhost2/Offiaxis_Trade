import { RegisterUserInput, UpdateRoleInput, SignUpInput, SignInInput, GoogleSignInInput } from './schema';
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

interface FirebasePasswordSignInResult {
  localId: string;
  idToken: string;
  expiresIn: string;
  displayName?: string;
}

async function signInWithFirebasePassword(email: string, password: string): Promise<FirebasePasswordSignInResult> {
  const restUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.FIREBASE_WEB_API_KEY}`;

  const response = await fetch(restUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
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

  return response.json() as Promise<FirebasePasswordSignInResult>;
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

  const tokenData = await signInWithFirebasePassword(input.email, input.password);
  const tokenExpiry = Date.now() + parseInt(tokenData.expiresIn, 10) * 1000;

  return {
    uid: firebaseUser.uid,
    email: input.email,
    displayName: input.displayName,
    token: tokenData.idToken,
    tokenExpiry,
    orgId,
    role: input.role ?? 'viewer',
  };
}

export async function signInUser(input: SignInInput): Promise<SignInResult> {
  const data = await signInWithFirebasePassword(input.email, input.password);
  const uid = data.localId;

  // Fetch MongoDB profile for role/orgId
  const doc = await findUserByUid(uid);

  const tokenExpiry = Date.now() + parseInt(data.expiresIn, 10) * 1000;

  return {
    uid,
    email: input.email,
    displayName: doc?.displayName ?? data.displayName ?? input.email,
    token: data.idToken,
    tokenExpiry,
    orgId: doc?.orgId ?? null,
    role: doc?.role ?? null,
  };
}

interface FirebaseIdpSignInResult {
  localId: string;
  idToken: string;
  expiresIn: string;
  email: string;
  displayName?: string;
}

async function signInWithGoogleIdp(input: GoogleSignInInput): Promise<FirebaseIdpSignInResult> {
  const postBody = input.idToken
    ? `id_token=${encodeURIComponent(input.idToken)}&providerId=google.com`
    : `access_token=${encodeURIComponent(input.accessToken!)}&providerId=google.com`;

  const restUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${config.FIREBASE_WEB_API_KEY}`;

  const response = await fetch(restUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postBody,
      requestUri: 'http://localhost',
      returnIdpCredential: true,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const body = await response.json() as { error?: { message?: string } };
    const msg = body.error?.message ?? 'Google sign-in failed';
    throw new AppError(msg, 401, 'GOOGLE_AUTH_FAILED');
  }

  return response.json() as Promise<FirebaseIdpSignInResult>;
}

export async function signInWithGoogle(input: GoogleSignInInput): Promise<SignInResult> {
  const data = await signInWithGoogleIdp(input);
  const uid = data.localId;

  // Ensure user profile exists in MongoDB (upsert for new Google users)
  let doc = await findUserByUid(uid);
  if (!doc) {
    const orgId = uid;
    await upsertUser({
      uid,
      email: data.email,
      displayName: data.displayName ?? data.email,
      role: 'owner',
      orgId,
    });
    doc = await findUserByUid(uid);
  }

  const tokenExpiry = Date.now() + parseInt(data.expiresIn, 10) * 1000;

  return {
    uid,
    email: data.email,
    displayName: doc?.displayName ?? data.displayName ?? data.email,
    token: data.idToken,
    tokenExpiry,
    orgId: doc?.orgId ?? uid,
    role: doc?.role ?? 'owner',
  };
}
