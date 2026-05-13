import { baseApi } from '../../shared/store/baseApi';

interface Receipt {
  _id: string;
  orgId: string;
  projectId?: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  imageUrl?: string;
  note?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const receiptsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listReceipts: builder.query<PaginatedResponse<Receipt>, { projectId?: string; cursor?: string; limit?: number }>({
      query: (params) => ({ url: '/api/receipts', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Receipt' as const, id: _id })),
              { type: 'Receipt', id: 'LIST' },
            ]
          : [{ type: 'Receipt', id: 'LIST' }],
    }),
    createReceipt: builder.mutation<Receipt, Omit<Receipt, '_id' | 'orgId' | 'createdBy' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({ url: '/api/receipts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Receipt', id: 'LIST' }],
    }),
    updateReceipt: builder.mutation<Receipt, { id: string; body: Partial<Receipt> }>({
      query: ({ id, body }) => ({ url: `/api/receipts/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Receipt', id }, { type: 'Receipt', id: 'LIST' }],
    }),
    deleteReceipt: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/receipts/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Receipt', id: 'LIST' }],
    }),
  }),
});

export const {
  useListReceiptsQuery,
  useCreateReceiptMutation,
  useUpdateReceiptMutation,
  useDeleteReceiptMutation,
} = receiptsApi;
