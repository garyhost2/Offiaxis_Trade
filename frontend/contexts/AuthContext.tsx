import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'owner' | 'admin' | 'project_manager' | 'field_worker' | 'subcontractor' | 'viewer';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  userRole: UserRole | null;
  orgId: string | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role?: UserRole, orgId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Legacy compat
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const AUTH_STORAGE_KEY = '@offiaxis_auth';

interface StoredAuth {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
  orgId: string | null;
  role: UserRole | null;
  tokenExpiry: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const persistAuth = async (auth: StoredAuth) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  };

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const err = await response.json() as { message?: string };
        throw new Error(err.message ?? 'Sign-in failed');
      }
      const data = await response.json() as { uid: string; email: string; displayName: string; token: string; tokenExpiry: number; orgId: string | null; role: UserRole | null };
      setCurrentUser({ uid: data.uid, email: data.email, displayName: data.displayName });
      setToken(data.token);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string, role: UserRole = 'viewer', orgIdParam?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, role, orgId: orgIdParam }),
      });
      if (!response.ok) {
        const err = await response.json() as { message?: string };
        throw new Error(err.message ?? 'Sign-up failed');
      }
      // After sign-up, sign in
      await signIn(email, password);
    } finally {
      setIsLoading(false);
    }
  }, [signIn]);

  const signOut = useCallback(async () => {
    setCurrentUser(null);
    setToken(null);
    setOrgId(null);
    setUserRole(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value: AuthContextType = {
    currentUser,
    userRole,
    orgId,
    token,
    isLoading,
    isAuthenticated: currentUser !== null,
    signIn,
    signUp,
    signOut,
    // Legacy compatibility
    login: () => { void signIn('', ''); },
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