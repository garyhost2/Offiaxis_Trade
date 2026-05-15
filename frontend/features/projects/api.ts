import { baseApi } from '../../shared/store/baseApi';

interface OtherContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  note?: string;
}

type ProjectStatus = 'Rough-In' | 'To be scheduled' | 'Inspection' | 'Completed' | 'Final Trim';

interface Project {
  _id: string;
  orgId: string;
  name: string;
  clientName?: string;
  street?: string;
  city?: string;
  phone?: string;
  permit?: string;
  status: ProjectStatus;
  initials?: string;
  otherContacts: OtherContact[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ListProjectsParams {
  cursor?: string;
  limit?: number;
  status?: ProjectStatus;
}

const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProjects: builder.query<PaginatedResponse<Project>, ListProjectsParams>({
      query: (params) => ({
        url: '/api/projects',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Project' as const, id: _id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),
    getProject: builder.query<Project, string>({
      query: (id) => `/api/projects/${id}`,
      providesTags: (_, __, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<Project, Partial<Project>>({
      query: (body) => ({ url: '/api/projects', method: 'POST', body }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    updateProject: builder.mutation<Project, { id: string; body: Partial<Project> }>({
      query: ({ id, body }) => ({ url: `/api/projects/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Project', id }, { type: 'Project', id: 'LIST' }],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
  }),
});

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
