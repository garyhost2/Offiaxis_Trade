import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateScheduleEventSchema,
  UpdateScheduleEventSchema,
  ScheduleEventResponseSchema,
} from './schema';
import {
  createScheduleEventService,
  getScheduleEventService,
  listScheduleEventsService,
  updateScheduleEventService,
  deleteScheduleEventService,
} from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/schedule', {
    schema: {
      querystring: z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        projectId: z.string().optional(),
      }),
      response: { 200: z.array(ScheduleEventResponseSchema) },
    },
  }, async (request, reply) => {
    const events = await listScheduleEventsService({
      orgId: request.user.orgId,
      ...request.query,
    });
    return reply.status(200).send(events);
  });

  fastify.post('/api/schedule', {
    schema: {
      body: CreateScheduleEventSchema,
      response: { 201: ScheduleEventResponseSchema },
    },
  }, async (request, reply) => {
    const event = await createScheduleEventService(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(event);
  });

  fastify.get('/api/schedule/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: ScheduleEventResponseSchema },
    },
  }, async (request, reply) => {
    const event = await getScheduleEventService(request.params.id, request.user.orgId);
    return reply.status(200).send(event);
  });

  fastify.patch('/api/schedule/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdateScheduleEventSchema,
      response: { 200: ScheduleEventResponseSchema },
    },
  }, async (request, reply) => {
    const event = await updateScheduleEventService(
      request.params.id,
      request.user.orgId,
      request.body
    );
    return reply.status(200).send(event);
  });

  fastify.delete('/api/schedule/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 204: z.null() },
    },
  }, async (request, reply) => {
    await deleteScheduleEventService(request.params.id, request.user.orgId);
    return reply.status(204).send();
  });
};

export default router;
