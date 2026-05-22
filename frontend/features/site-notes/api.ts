import { baseApi } from '../../shared/store/baseApi';

interface SiteNotesRequest {
  images: string[];
  voiceNotes: string[];
  projectId?: string;
  projectContext?: string;
}

interface SiteNotesResponse {
  success: boolean;
  punchList?: Array<{ id: string; description: string; location?: string | null; priority: 'High' | 'Medium' | 'Low'; status: string }>;
  checklist?: Array<{ id: string; task: string; category: string; checked: boolean }>;
  materialList?: Array<{ id: string; name: string; quantity: string; category: string; notes?: string | null }>;
  error?: string;
}

const siteNotesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    processSiteNotes: builder.mutation<SiteNotesResponse, SiteNotesRequest>({
      query: (body) => ({ url: '/api/site-notes/process', method: 'POST', body }),
    }),
  }),
});

export const { useProcessSiteNotesMutation } = siteNotesApi;
