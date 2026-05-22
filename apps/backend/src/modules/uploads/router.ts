import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { UploadAssetResponseSchema, UploadAssetSchema } from './schema';
import { uploadAssetService } from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/api/uploads', {
    schema: {
      body: UploadAssetSchema,
      response: { 201: UploadAssetResponseSchema },
    },
  }, async (request, reply) => {
    const uploaded = await uploadAssetService(request.user.orgId, request.body);
    return reply.status(201).send(uploaded);
  });
};

export default router;