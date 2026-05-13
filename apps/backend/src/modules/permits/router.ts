import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreatePermitSchema,
  UpdatePermitSchema,
  PermitResponseSchema,
  ExtractPermitSchema,
} from './schema';
import {
  createPermitService,
  getPermitService,
  listPermitsService,
  updatePermitService,
  deletePermitService,
  extractPermitData,
} from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/permits', {
    schema: {
      querystring: z.object({
        projectId: z.string().optional(),
      }),
      response: { 200: z.array(PermitResponseSchema) },
    },
  }, async (request, reply) => {
    const permits = await listPermitsService({
      orgId: request.user.orgId,
      projectId: request.query.projectId,
    });
    return reply.status(200).send(permits);
  });

  fastify.post('/api/permits', {
    schema: {
      body: CreatePermitSchema,
      response: { 201: PermitResponseSchema },
    },
  }, async (request, reply) => {
    const permit = await createPermitService(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(permit);
  });

  fastify.get('/api/permits/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: PermitResponseSchema },
    },
  }, async (request, reply) => {
    const permit = await getPermitService(request.params.id, request.user.orgId);
    return reply.status(200).send(permit);
  });

  fastify.patch('/api/permits/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdatePermitSchema,
      response: { 200: PermitResponseSchema },
    },
  }, async (request, reply) => {
    const permit = await updatePermitService(
      request.params.id,
      request.user.orgId,
      request.body
    );
    return reply.status(200).send(permit);
  });

  fastify.delete('/api/permits/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 204: z.null() },
    },
  }, async (request, reply) => {
    await deletePermitService(request.params.id, request.user.orgId);
    return reply.status(204).send();
  });

  fastify.post('/api/extract-permit', {
    schema: {
      body: ExtractPermitSchema,
      response: {
        200: z.object({
          extractedData: z.record(z.string(), z.unknown()),
        }),
      },
    },
  }, async (request, reply) => {
    const extractedData = await extractPermitData(request.body.imageUrl);
    return reply.status(200).send({ extractedData });
  });
};

export default router;
