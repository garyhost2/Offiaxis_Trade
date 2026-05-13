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

export async function attachRole(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.url === '/health') {
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
