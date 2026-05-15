import { baseApi } from '../../shared/store/baseApi';

type EventType = 'job' | 'inspection' | 'meeting' | 'other';
type EventStatus = 'scheduled' | 'completed' | 'cancelled';

interface ScheduleEvent {
  _id: string;
  orgId: string;
  projectId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  assignedTo: string[];
  type: EventType;
  status: EventStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

const scheduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listScheduleEvents: builder.query<ScheduleEvent[], { startDate?: string; endDate?: string; projectId?: string }>({
      query: (params) => ({ url: '/api/schedule', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'ScheduleEvent' as const, id: _id })),
              { type: 'ScheduleEvent', id: 'LIST' },
            ]
          : [{ type: 'ScheduleEvent', id: 'LIST' }],
    }),
    createScheduleEvent: builder.mutation<ScheduleEvent, Omit<ScheduleEvent, '_id' | 'orgId' | 'createdBy' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({ url: '/api/schedule', method: 'POST', body }),
      invalidatesTags: [{ type: 'ScheduleEvent', id: 'LIST' }],
    }),
    updateScheduleEvent: builder.mutation<ScheduleEvent, { id: string; body: Partial<ScheduleEvent> }>({
      query: ({ id, body }) => ({ url: `/api/schedule/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'ScheduleEvent', id }, { type: 'ScheduleEvent', id: 'LIST' }],
    }),
    deleteScheduleEvent: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/schedule/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'ScheduleEvent', id: 'LIST' }],
    }),
  }),
});

export const {
  useListScheduleEventsQuery,
  useCreateScheduleEventMutation,
  useUpdateScheduleEventMutation,
  useDeleteScheduleEventMutation,
} = scheduleApi;
