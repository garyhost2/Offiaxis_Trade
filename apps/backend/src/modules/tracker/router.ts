import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  ClockInSchema,
  ClockOutSchema,
  ManualEntrySchema,
  ReviewSessionSchema,
  TrackerSessionResponseSchema,
  PaginatedSessionsSchema,
} from './schema';
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  createManualEntry,
  reviewSession,
  listSessionsService,
  getSessionService,
} from './service';
import { ForbiddenError } from '../../shared/errors';
import { SUPERVISOR_ROLES } from '../auth/types';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/api/tracker/clock-in', {
    schema: {
      body: ClockInSchema,
      response: { 201: TrackerSessionResponseSchema },
    },
  }, async (request, reply) => {
    const session = await clockIn(request.user.orgId, request.user.uid, request.body);
    return reply.status(201).send(session);
  });

  fastify.post('/api/tracker/clock-out/:sessionId', {
    schema: {
      params: z.object({ sessionId: z.string() }),
      body: ClockOutSchema,
      response: { 200: TrackerSessionResponseSchema },
    },
  }, async (request, reply) => {
    const session = await clockOut(
      request.params.sessionId,
      request.user.orgId,
      request.user.uid
    );
    return reply.status(200).send(session);
  });

  fastify.post('/api/tracker/break-start/:sessionId', {
    schema: {
      params: z.object({ sessionId: z.string() }),
      response: { 200: TrackerSessionResponseSchema },
    },
  }, async (request, reply) => {
    const session = await startBreak(
      request.params.sessionId,
      request.user.orgId,
      request.user.uid
    );
    return reply.status(200).send(session);
  });

  fastify.post('/api/tracker/break-end/:sessionId', {
    schema: {
      params: z.object({ sessionId: z.string() }),
      response: { 200: TrackerSessionResponseSchema },
    },
  }, async (request, reply) => {
    const session = await endBreak(
      request.params.sessionId,
      request.user.orgId,
      request.user.uid
    );
    return reply.status(200).send(session);
  });

  fastify.get('/api/tracker/sessions', {
    schema: {
      querystring: z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }),
      response: { 200: PaginatedSessionsSchema },
    },
  }, async (request, reply) => {
    const { cursor, limit } = request.query;
    const isSupervisor = SUPERVISOR_ROLES.includes(request.userRole as typeof SUPERVISOR_ROLES[number]);
    const userId = isSupervisor ? undefined : request.user.uid;
    const result = await listSessionsService({ orgId: request.user.orgId, userId, cursor, limit });
    return reply.status(200).send(result);
  });

  fastify.get('/api/tracker/sessions/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: TrackerSessionResponseSchema },
    },
  }, async (request, reply) => {
    const session = await getSessionService(request.params.id, request.user.orgId);
    return reply.status(200).send(session);
  });

  fastify.post('/api/tracker/manual', {
    schema: {
      body: ManualEntrySchema,
      response: { 201: TrackerSessionResponseSchema },
    },
  }, async (request, reply) => {
    const session = await createManualEntry(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(session);
  });

  fastify.patch('/api/tracker/review/:sessionId', {
    schema: {
      params: z.object({ sessionId: z.string() }),
      body: ReviewSessionSchema,
      response: { 200: TrackerSessionResponseSchema },
    },
  }, async (request, reply) => {
    if (!SUPERVISOR_ROLES.includes(request.userRole as typeof SUPERVISOR_ROLES[number])) {
      throw new ForbiddenError('Only supervisors can review sessions');
    }
    const session = await reviewSession(
      request.params.sessionId,
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(200).send(session);
  });
};

export default router;
