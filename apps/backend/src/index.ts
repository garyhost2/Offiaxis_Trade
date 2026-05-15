import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './core/config';
import { connectDB } from './core/mongodb';
import log from './core/logger';
import { verifyFirebaseToken } from './middleware/verifyFirebaseToken';
import { attachRole } from './middleware/attachRole';
import { isAppError } from './shared/errors';

import authRouter from './modules/auth/router';
import projectsRouter from './modules/projects/router';
import trackerRouter from './modules/tracker/router';
import changeOrdersRouter from './modules/change-orders/router';
import financialsRouter from './modules/financials/router';
import receiptsRouter from './modules/receipts/router';
import inventoryRouter from './modules/inventory/router';
import scheduleRouter from './modules/schedule/router';
import permitsRouter from './modules/permits/router';

if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

async function buildApp() {
  const fastify = Fastify({
    logger: false,
    genReqId: () => crypto.randomUUID(),
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(cors, {
    origin: config.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.user?.orgId ?? request.ip;
    },
  });

  fastify.addHook('onRequest', verifyFirebaseToken);
  fastify.addHook('onRequest', attachRole);

  fastify.setErrorHandler((error: unknown, request, reply) => {
    if (isAppError(error)) {
      log.warn(error.message, {
        requestId: request.id,
        userId: request.user?.uid,
        orgId: request.user?.orgId,
        code: error.code,
      });
      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.code,
      });
    }

    // Fastify validation errors have a `.validation` property
    const fastifyError = error as { validation?: unknown; message?: string; stack?: string };
    if (fastifyError.validation) {
      return reply.status(422).send({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: fastifyError.validation,
      });
    }

    log.error('Unhandled error', {
      requestId: request.id,
      userId: request.user?.uid,
      orgId: request.user?.orgId,
      error: fastifyError.message ?? String(error),
      stack: fastifyError.stack,
    });

    if (config.SENTRY_DSN) {
      Sentry.captureException(error);
    }

    return reply.status(500).send({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await fastify.register(authRouter);
  await fastify.register(projectsRouter);
  await fastify.register(trackerRouter);
  await fastify.register(changeOrdersRouter);
  await fastify.register(financialsRouter);
  await fastify.register(receiptsRouter);
  await fastify.register(inventoryRouter);
  await fastify.register(scheduleRouter);
  await fastify.register(permitsRouter);

  return fastify;
}

async function main() {
  try {
    await connectDB();
    log.info('MongoDB connected successfully', { requestId: 'startup' });

    const app = await buildApp();

    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    log.info(`Server listening on port ${config.PORT}`, {
      requestId: 'startup',
      port: config.PORT.toString(),
      env: config.NODE_ENV,
    });
  } catch (error) {
    log.error('Fatal startup error', {
      requestId: 'startup',
      error: error instanceof Error ? error.message : String(error),
    });
    if (config.SENTRY_DSN) {
      Sentry.captureException(error);
    }
    process.exit(1);
  }
}

void main();
