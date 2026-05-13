import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  RegisterUserSchema,
  UpdateRoleSchema,
  UserResponseSchema,
} from './schema';
import { registerOrUpdateUser, getMe, changeUserRole } from './service';
import { ForbiddenError } from '../../shared/errors';
import { ADMIN_ROLES } from './types';
import log from '../../core/logger';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/api/auth/register', {
    schema: {
      body: RegisterUserSchema,
      response: {
        200: UserResponseSchema,
      },
    },
  }, async (request, reply) => {
    const user = await registerOrUpdateUser(request.body);
    return reply.status(200).send(user);
  });

  fastify.get('/api/auth/me', {
    schema: {
      response: {
        200: UserResponseSchema,
      },
    },
  }, async (request, reply) => {
    const user = await getMe(request.user.uid);
    return reply.status(200).send(user);
  });

  fastify.patch('/api/auth/role', {
    schema: {
      body: UpdateRoleSchema,
      response: {
        200: UserResponseSchema,
      },
    },
  }, async (request, reply) => {
    if (!ADMIN_ROLES.includes(request.userRole)) {
      throw new ForbiddenError('Only owner or admin can change user roles');
    }

    const user = await changeUserRole(request.body, request.user.orgId);
    log.info('User role updated', {
      userId: request.user.uid,
      orgId: request.user.orgId,
      requestId: request.id,
      targetUid: request.body.uid,
      newRole: request.body.role,
    });
    return reply.status(200).send(user);
  });
};

export default router;
