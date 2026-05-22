import Constants from 'expo-constants';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const expoExtra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  expoExtra?.EXPO_PUBLIC_API_URL ??
  expoExtra?.apiUrl ??
  'http://localhost:3000';

// Token provider - will be set by AuthContext
let tokenProvider: (() => string | null) | null = null;
export function setTokenProvider(provider: () => string | null) {
  tokenProvider = provider;
}

export function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function getAuthHeaders(headers: Record<string, string> = {}) {
  const token = tokenProvider?.();
  if (!token) {
    return headers;
  }
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = tokenProvider?.();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Project', 'TrackerSession', 'ChangeOrder',
    'Expense', 'Income', 'Receipt', 'InventoryItem',
    'ScheduleEvent', 'Permit', 'User',
  ],
  endpoints: () => ({}),
});
