import { baseApi } from '../../shared/store/baseApi';

type UploadFolder =
  | 'projects'
  | 'permits'
  | 'receipts'
  | 'change-orders'
  | 'site-notes'
  | 'inventory'
  | 'knowledge-center';

interface UploadAssetRequest {
  fileBase64: string;
  fileName?: string;
  contentType?: string;
  folder?: UploadFolder;
}

interface UploadAssetResponse {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
}

const uploadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadAsset: builder.mutation<UploadAssetResponse, UploadAssetRequest>({
      query: (body) => ({ url: '/api/uploads', method: 'POST', body }),
    }),
  }),
});

export const { useUploadAssetMutation } = uploadsApi;