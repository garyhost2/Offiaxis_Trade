import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateReceiptSchema,
  UpdateReceiptSchema,
  ReceiptResponseSchema,
  PaginatedReceiptsSchema,
} from './schema';
import {
  createReceiptService,
  getReceiptService,
  listReceiptsService,
  updateReceiptService,
  deleteReceiptService,
} from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/receipts', {
    schema: {
      querystring: z.object({
        projectId: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }),
      response: { 200: PaginatedReceiptsSchema },
    },
  }, async (request, reply) => {
    const result = await listReceiptsService({
      orgId: request.user.orgId,
      ...request.query,
    });
    return reply.status(200).send(result);
  });

  fastify.post('/api/receipts', {
    schema: {
      body: CreateReceiptSchema,
      response: { 201: ReceiptResponseSchema },
    },
  }, async (request, reply) => {
    const receipt = await createReceiptService(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(receipt);
  });

  fastify.get('/api/receipts/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: ReceiptResponseSchema },
    },
  }, async (request, reply) => {
    const receipt = await getReceiptService(request.params.id, request.user.orgId);
    return reply.status(200).send(receipt);
  });

  fastify.patch('/api/receipts/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdateReceiptSchema,
      response: { 200: ReceiptResponseSchema },
    },
  }, async (request, reply) => {
    const receipt = await updateReceiptService(
      request.params.id,
      request.user.orgId,
      request.body
    );
    return reply.status(200).send(receipt);
  });

  fastify.delete('/api/receipts/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 204: z.null() },
    },
  }, async (request, reply) => {
    await deleteReceiptService(request.params.id, request.user.orgId);
    return reply.status(204).send(null);
  });
};

export default router;
