import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateChangeOrderSchema,
  UpdateChangeOrderSchema,
  ChangeOrderResponseSchema,
  PaginatedChangeOrdersSchema,
} from './schema';
import {
  createChangeOrderService,
  getChangeOrderService,
  listChangeOrdersService,
  updateChangeOrderService,
  deleteChangeOrderService,
} from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/change-orders', {
    schema: {
      querystring: z.object({
        projectId: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }),
      response: { 200: PaginatedChangeOrdersSchema },
    },
  }, async (request, reply) => {
    const { projectId, cursor, limit } = request.query;
    const result = await listChangeOrdersService({
      orgId: request.user.orgId,
      projectId,
      cursor,
      limit,
    });
    return reply.status(200).send(result);
  });

  fastify.post('/api/change-orders', {
    schema: {
      body: CreateChangeOrderSchema,
      response: { 201: ChangeOrderResponseSchema },
    },
  }, async (request, reply) => {
    const co = await createChangeOrderService(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(co);
  });

  fastify.get('/api/change-orders/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: ChangeOrderResponseSchema },
    },
  }, async (request, reply) => {
    const co = await getChangeOrderService(request.params.id, request.user.orgId);
    return reply.status(200).send(co);
  });

  fastify.patch('/api/change-orders/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdateChangeOrderSchema,
      response: { 200: ChangeOrderResponseSchema },
    },
  }, async (request, reply) => {
    const co = await updateChangeOrderService(
      request.params.id,
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(200).send(co);
  });

  fastify.delete('/api/change-orders/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 204: z.null() },
    },
  }, async (request, reply) => {
    await deleteChangeOrderService(request.params.id, request.user.orgId);
    return reply.status(204).send();
  });
};

export default router;
