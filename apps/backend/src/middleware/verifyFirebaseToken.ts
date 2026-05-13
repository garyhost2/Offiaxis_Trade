import { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '../core/firebase';
import { UnauthorizedError } from '../shared/errors';
import log from '../core/logger';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      uid: string;
      email: string;
      orgId: string;
    };
  }
}

export async function verifyFirebaseToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.url === '/health') {
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    const err = new UnauthorizedError('Missing or invalid Authorization header');
    await reply.status(err.statusCode).send({ error: err.message, code: err.code });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await auth.verifyIdToken(token);
    const orgId = (decoded['orgId'] as string | undefined) ?? decoded.uid;

    request.user = {
      uid: decoded.uid,
      email: decoded.email ?? '',
      orgId,
    };
  } catch (error) {
    log.warn('Firebase token verification failed', {
      requestId: request.id,
      error: error instanceof Error ? error.message : String(error),
    });
    const err = new UnauthorizedError('Invalid or expired token');
    await reply.status(err.statusCode).send({ error: err.message, code: err.code });
  }
}
