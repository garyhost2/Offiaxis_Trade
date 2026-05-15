import { baseApi } from '../../shared/store/baseApi';

type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

interface InventoryItem {
  _id: string;
  orgId: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  location?: string;
  supplier?: string;
  status: InventoryStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listInventory: builder.query<PaginatedResponse<InventoryItem>, { cursor?: string; limit?: number; status?: InventoryStatus }>({
      query: (params) => ({ url: '/api/inventory', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'InventoryItem' as const, id: _id })),
              { type: 'InventoryItem', id: 'LIST' },
            ]
          : [{ type: 'InventoryItem', id: 'LIST' }],
    }),
    createInventoryItem: builder.mutation<InventoryItem, Omit<InventoryItem, '_id' | 'orgId' | 'createdBy' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({ url: '/api/inventory', method: 'POST', body }),
      invalidatesTags: [{ type: 'InventoryItem', id: 'LIST' }],
    }),
    updateInventoryItem: builder.mutation<InventoryItem, { id: string; body: Partial<InventoryItem> }>({
      query: ({ id, body }) => ({ url: `/api/inventory/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'InventoryItem', id }, { type: 'InventoryItem', id: 'LIST' }],
    }),
    deleteInventoryItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/inventory/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'InventoryItem', id: 'LIST' }],
    }),
  }),
});

export const {
  useListInventoryQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
} = inventoryApi;
