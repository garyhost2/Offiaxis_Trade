import { baseApi } from '../../shared/store/baseApi';

type PermitStatus = 'pending' | 'active' | 'expired';

interface Permit {
  _id: string;
  orgId: string;
  projectId: string;
  permitNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  fees?: string;
  imageUrl?: string;
  status: PermitStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExtractPermitResponse {
  permitNumber?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  fees?: string | null;
  success: boolean;
  error?: string | null;
}

const permitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPermits: builder.query<Permit[], { projectId?: string }>({
      query: (params) => ({ url: '/api/permits', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Permit' as const, id: _id })),
              { type: 'Permit', id: 'LIST' },
            ]
          : [{ type: 'Permit', id: 'LIST' }],
    }),
    createPermit: builder.mutation<Permit, Omit<Permit, '_id' | 'orgId' | 'createdBy' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({ url: '/api/permits', method: 'POST', body }),
      invalidatesTags: [{ type: 'Permit', id: 'LIST' }],
    }),
    extractPermit: builder.mutation<ExtractPermitResponse, { imageBase64: string }>({
      query: (body) => ({ url: '/api/extract-permit', method: 'POST', body }),
    }),
    updatePermit: builder.mutation<Permit, { id: string; body: Partial<Permit> }>({
      query: ({ id, body }) => ({ url: `/api/permits/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Permit', id }, { type: 'Permit', id: 'LIST' }],
    }),
    deletePermit: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/permits/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Permit', id: 'LIST' }],
    }),
  }),
});

export const {
  useListPermitsQuery,
  useCreatePermitMutation,
  useExtractPermitMutation,
  useUpdatePermitMutation,
  useDeletePermitMutation,
} = permitsApi;
