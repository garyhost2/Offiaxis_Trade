import { baseApi } from '../../shared/store/baseApi';

interface SiteNotesRequest {
  voiceText?: string;
  photoBase64?: string;
  projectId?: string;
  location?: string;
}

interface SiteNotesResponse {
  success: boolean;
  processedNotes?: string;
  punchList?: Array<{ task: string; priority: string; assignTo: string }>;
  materials?: Array<{ item: string; quantity: string; urgency: string }>;
  safetyIssues?: string[];
  followUpItems?: string[];
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
