import { baseApi } from '../../shared/store/baseApi';

type TrackerStatus = 'active' | 'on_break' | 'completed' | 'pending_review';

interface TrackerSession {
  _id: string;
  orgId: string;
  userId: string;
  projectId?: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  status: TrackerStatus;
  note?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  manualEntry: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const trackerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSessions: builder.query<PaginatedResponse<TrackerSession>, { cursor?: string; limit?: number }>({
      query: (params) => ({ url: '/api/tracker/sessions', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'TrackerSession' as const, id: _id })),
              { type: 'TrackerSession', id: 'LIST' },
            ]
          : [{ type: 'TrackerSession', id: 'LIST' }],
    }),
    clockIn: builder.mutation<TrackerSession, { projectId?: string; note?: string }>({
      query: (body) => ({ url: '/api/tracker/clock-in', method: 'POST', body }),
      invalidatesTags: [{ type: 'TrackerSession', id: 'LIST' }],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        // Optimistic update: add a placeholder session
        const patchResult = dispatch(
          baseApi.util.updateQueryData('listSessions', {}, (draft) => {
            draft.data.unshift({
              _id: 'optimistic-' + Date.now(),
              orgId: '',
              userId: '',
              clockIn: new Date().toISOString(),
              status: 'active',
              manualEntry: false,
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    clockOut: builder.mutation<TrackerSession, string>({
      query: (sessionId) => ({ url: `/api/tracker/clock-out/${sessionId}`, method: 'POST' }),
      invalidatesTags: (_, __, sessionId) => [{ type: 'TrackerSession', id: sessionId }, { type: 'TrackerSession', id: 'LIST' }],
    }),
    startBreak: builder.mutation<TrackerSession, string>({
      query: (sessionId) => ({ url: `/api/tracker/break-start/${sessionId}`, method: 'POST' }),
      invalidatesTags: (_, __, sessionId) => [{ type: 'TrackerSession', id: sessionId }],
    }),
    endBreak: builder.mutation<TrackerSession, string>({
      query: (sessionId) => ({ url: `/api/tracker/break-end/${sessionId}`, method: 'POST' }),
      invalidatesTags: (_, __, sessionId) => [{ type: 'TrackerSession', id: sessionId }],
    }),
    createManualEntry: builder.mutation<TrackerSession, { projectId?: string; clockIn: string; clockOut: string; note?: string }>({
      query: (body) => ({ url: '/api/tracker/manual', method: 'POST', body }),
      invalidatesTags: [{ type: 'TrackerSession', id: 'LIST' }],
    }),
    reviewSession: builder.mutation<TrackerSession, { sessionId: string; approved: boolean; note?: string }>({
      query: ({ sessionId, ...body }) => ({ url: `/api/tracker/review/${sessionId}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { sessionId }) => [{ type: 'TrackerSession', id: sessionId }, { type: 'TrackerSession', id: 'LIST' }],
    }),
  }),
});

export const {
  useListSessionsQuery,
  useClockInMutation,
  useClockOutMutation,
  useStartBreakMutation,
  useEndBreakMutation,
  useCreateManualEntryMutation,
  useReviewSessionMutation,
} = trackerApi;
