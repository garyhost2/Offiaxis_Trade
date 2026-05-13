import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  InventoryItemResponseSchema,
  PaginatedInventorySchema,
  InventoryStatusSchema,
} from './schema';
import {
  createInventoryItemService,
  getInventoryItemService,
  listInventoryService,
  updateInventoryItemService,
  deleteInventoryItemService,
} from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/inventory', {
    schema: {
      querystring: z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: InventoryStatusSchema.optional(),
      }),
      response: { 200: PaginatedInventorySchema },
    },
  }, async (request, reply) => {
    const result = await listInventoryService({
      orgId: request.user.orgId,
      ...request.query,
    });
    return reply.status(200).send(result);
  });

  fastify.post('/api/inventory', {
    schema: {
      body: CreateInventoryItemSchema,
      response: { 201: InventoryItemResponseSchema },
    },
  }, async (request, reply) => {
    const item = await createInventoryItemService(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(item);
  });

  fastify.get('/api/inventory/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: InventoryItemResponseSchema },
    },
  }, async (request, reply) => {
    const item = await getInventoryItemService(request.params.id, request.user.orgId);
    return reply.status(200).send(item);
  });

  fastify.patch('/api/inventory/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdateInventoryItemSchema,
      response: { 200: InventoryItemResponseSchema },
    },
  }, async (request, reply) => {
    const item = await updateInventoryItemService(
      request.params.id,
      request.user.orgId,
      request.body
    );
    return reply.status(200).send(item);
  });

  fastify.delete('/api/inventory/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 204: z.null() },
    },
  }, async (request, reply) => {
    await deleteInventoryItemService(request.params.id, request.user.orgId);
    return reply.status(204).send(null);
  });
};

export default router;
