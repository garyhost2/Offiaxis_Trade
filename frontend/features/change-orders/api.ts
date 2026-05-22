import { baseApi } from '../../shared/store/baseApi';

type ChangeOrderStatus = 'Submitted' | 'In Review' | 'Approved' | 'Rejected' | 'On Hold';
type ChangeOrderType = 'Invoice' | 'Change Order' | 'Modification';

interface ChangeOrder {
  _id: string;
  orgId: string;
  projectId: number | string;
  title: string;
  description?: string;
  amount: number;
  date: string;
  status: ChangeOrderStatus;
  type: ChangeOrderType;
  requestedBy: string;
  fileUrl?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const changeOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listChangeOrders: builder.query<PaginatedResponse<ChangeOrder>, { projectId?: string; cursor?: string; limit?: number }>({
      query: (params) => ({ url: '/api/change-orders', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'ChangeOrder' as const, id: _id })),
              { type: 'ChangeOrder', id: 'LIST' },
            ]
          : [{ type: 'ChangeOrder', id: 'LIST' }],
    }),
    createChangeOrder: builder.mutation<ChangeOrder, Omit<ChangeOrder, '_id' | 'orgId' | 'createdBy' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({ url: '/api/change-orders', method: 'POST', body }),
      invalidatesTags: [{ type: 'ChangeOrder', id: 'LIST' }],
    }),
    updateChangeOrder: builder.mutation<ChangeOrder, { id: string; body: Partial<ChangeOrder> }>({
      query: ({ id, body }) => ({ url: `/api/change-orders/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'ChangeOrder', id }, { type: 'ChangeOrder', id: 'LIST' }],
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
        // Optimistic update for status toggle
        const patchResult = dispatch(
          changeOrdersApi.util.updateQueryData('listChangeOrders', {}, (draft) => {
            const item = draft.data.find((co) => co._id === id);
            if (item && body.status) {
              item.status = body.status;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteChangeOrder: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/change-orders/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'ChangeOrder', id: 'LIST' }],
    }),
  }),
});

export const {
  useListChangeOrdersQuery,
  useCreateChangeOrderMutation,
  useUpdateChangeOrderMutation,
  useDeleteChangeOrderMutation,
} = changeOrdersApi;
