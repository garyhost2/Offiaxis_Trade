import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectResponseSchema,
  PaginatedProjectsSchema,
  ProjectStatusSchema,
} from './schema';
import {
  createProjectService,
  getProjectService,
  listProjectsService,
  updateProjectService,
  deleteProjectService,
} from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/projects', {
    schema: {
      querystring: z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: ProjectStatusSchema.optional(),
      }),
      response: { 200: PaginatedProjectsSchema },
    },
  }, async (request, reply) => {
    const { cursor, limit, status } = request.query;
    const result = await listProjectsService({
      orgId: request.user.orgId,
      cursor,
      limit,
      status,
    });
    return reply.status(200).send(result);
  });

  fastify.post('/api/projects', {
    schema: {
      body: CreateProjectSchema,
      response: { 201: ProjectResponseSchema },
    },
  }, async (request, reply) => {
    const project = await createProjectService(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(project);
  });

  fastify.get('/api/projects/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: ProjectResponseSchema },
    },
  }, async (request, reply) => {
    const project = await getProjectService(request.params.id, request.user.orgId);
    return reply.status(200).send(project);
  });

  fastify.patch('/api/projects/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdateProjectSchema,
      response: { 200: ProjectResponseSchema },
    },
  }, async (request, reply) => {
    const project = await updateProjectService(
      request.params.id,
      request.user.orgId,
      request.body
    );
    return reply.status(200).send(project);
  });

  fastify.delete('/api/projects/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 204: z.null() },
    },
  }, async (request, reply) => {
    await deleteProjectService(request.params.id, request.user.orgId);
    return reply.status(204).send(null);
  });
};

export default router;
