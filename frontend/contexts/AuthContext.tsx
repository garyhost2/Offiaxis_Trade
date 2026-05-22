import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildApiUrl, setTokenProvider } from '../shared/store/baseApi';

export type UserRole = 'owner' | 'admin' | 'project_manager' | 'field_worker' | 'subcontractor' | 'viewer';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface PendingSignUp {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
  accountType?: 'gc' | 'trade';
}

interface AuthResponse {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
  tokenExpiry: number;
  orgId: string | null;
  role: UserRole | null;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  userRole: UserRole | null;
  orgId: string | null;
  token: string | null;
  pendingSignUp: PendingSignUp | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken?: string, accessToken?: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role?: UserRole, orgId?: string) => Promise<void>;
  setPendingSignUp: (input: PendingSignUp | null) => void;
  completePendingSignUp: (overrides?: Partial<PendingSignUp>) => Promise<void>;
  signOut: () => Promise<void>;
  devAdminLogin: () => Promise<void>;
  // Legacy compat
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@offiaxis_auth';
const DEV_AUTH_DURATION_MS = 24 * 60 * 60 * 1000;
export const isDevAuthEnabled = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_E2E_AUTH === '1';

interface StoredAuth {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
  orgId: string | null;
  role: UserRole | null;
  tokenExpiry: number;
}

const createDevAuth = (): StoredAuth => ({
  uid: 'dev-admin',
  email: 'admin@offiaxis.dev',
  displayName: 'Dev Admin',
  token: 'DEV_BYPASS_TOKEN',
  orgId: 'dev-org',
  role: 'owner',
  tokenExpiry: Date.now() + DEV_AUTH_DURATION_MS,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingSignUp, setPendingSignUp] = useState<PendingSignUp | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTokenProvider(() => token);
  }, [token]);

  // Load persisted auth on startup
  useEffect(() => {
    void loadPersistedAuth();
  }, []);

  const loadPersistedAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: StoredAuth = JSON.parse(stored) as StoredAuth;
        // Check token expiry (refresh if within 5 min of expiry)
        if (parsed.tokenExpiry > Date.now() + 5 * 60 * 1000) {
          setCurrentUser({ uid: parsed.uid, email: parsed.email, displayName: parsed.displayName });
          setToken(parsed.token);
          setTokenProvider(() => parsed.token);
          setOrgId(parsed.orgId);
          setUserRole(parsed.role);
        } else {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setIsLoading(false);
    }
  };

  const persistAuth = useCallback(async (auth: StoredAuth) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, []);

  const applyAuthResponse = useCallback(async (data: AuthResponse) => {
    setCurrentUser({ uid: data.uid, email: data.email, displayName: data.displayName });
    setToken(data.token);
    setTokenProvider(() => data.token);
    setOrgId(data.orgId);
    setUserRole(data.role);
    await persistAuth({
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      token: data.token,
      orgId: data.orgId,
      role: data.role,
      tokenExpiry: data.tokenExpiry,
    });
  }, [persistAuth]);

  const parseErrorMessage = async (response: Response, fallback: string) => {
    try {
      const err = await response.json() as { message?: string; error?: string };
      return err.message ?? err.error ?? fallback;
    } catch {
      return fallback;
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/auth/sign-in'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'Sign-in failed'));
      }
      const data = await response.json() as AuthResponse;
      await applyAuthResponse(data);
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthResponse]);

  const signUp = useCallback(async (email: string, password: string, displayName: string, role: UserRole = 'viewer', orgIdParam?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/auth/sign-up'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, role, orgId: orgIdParam }),
      });
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'Sign-up failed'));
      }
      const data = await response.json() as AuthResponse;
      await applyAuthResponse(data);
      setPendingSignUp(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthResponse]);

  const completePendingSignUp = useCallback(async (overrides: Partial<PendingSignUp> = {}) => {
    if (!pendingSignUp) {
      throw new Error('Create your account before continuing.');
    }

    const input = { ...pendingSignUp, ...overrides };
    await signUp(input.email, input.password, input.displayName, input.role ?? 'owner');
  }, [pendingSignUp, signUp]);

  const signInWithGoogle = useCallback(async (idToken?: string, accessToken?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, accessToken }),
      });
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response, 'Google sign-in failed'));
      }
      const data = await response.json() as AuthResponse;
      await applyAuthResponse(data);
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthResponse]);

  const signOut = useCallback(async () => {
    setCurrentUser(null);
    setToken(null);
    setTokenProvider(() => null);
    setOrgId(null);
    setUserRole(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  // Development/test-only bypass for local QA and Playwright fixtures.
  const devAdminLogin = useCallback(async () => {
    if (!isDevAuthEnabled) {
      return;
    }

    const auth = createDevAuth();
    setCurrentUser({ uid: auth.uid, email: auth.email, displayName: auth.displayName });
    setToken(auth.token);
    setTokenProvider(() => auth.token);
    setOrgId(auth.orgId);
    setUserRole(auth.role);
    await persistAuth(auth);
  }, [persistAuth]);

  const value: AuthContextType = {
    currentUser,
    userRole,
    orgId,
    token,
    pendingSignUp,
    isLoading,
    isAuthenticated: currentUser !== null,
    signIn,
    signInWithGoogle,
    signUp,
    setPendingSignUp,
    completePendingSignUp,
    signOut,
    devAdminLogin,
    // Legacy compatibility
    login: () => {},
    logout: () => { void signOut(); },
    loading: isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}