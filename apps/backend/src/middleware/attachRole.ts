import { FastifyRequest, FastifyReply } from 'fastify';
import { UserModel } from '../modules/auth/repository';
import { UserRole } from '../modules/auth/types';
import { ForbiddenError } from '../shared/errors';
import log from '../core/logger';

declare module 'fastify' {
  interface FastifyRequest {
    userRole: UserRole;
  }
}

const PUBLIC_PATHS = new Set(['/health', '/api/auth/sign-in', '/api/auth/sign-up']);

export async function attachRole(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip public routes
  if (PUBLIC_PATHS.has(request.url.split('?')[0])) {
    return;
  }

  // Skip if skipAuth config is set
  if (request.routeOptions?.config?.skipAuth === true) {
    return;
  }

  const uid = request.user?.uid;
  if (!uid) {
    return;
  }

  const user = await UserModel.findOne({ uid }).lean().exec();

  if (!user) {
    log.warn('User not found in DB during attachRole', {
      requestId: request.id,
      userId: uid,
      orgId: request.user?.orgId,
    });
    const err = new ForbiddenError('User account not found');
    await reply.status(err.statusCode).send({ error: err.message, code: err.code });
    return;
  }

  request.userRole = user.role;
}
