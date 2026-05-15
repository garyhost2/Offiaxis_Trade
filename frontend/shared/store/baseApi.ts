import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Token provider - will be set by AuthContext
let tokenProvider: (() => string | null) | null = null;
export function setTokenProvider(provider: () => string | null) {
  tokenProvider = provider;
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
