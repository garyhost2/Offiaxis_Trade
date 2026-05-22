import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { SiteNotesRequestSchema, SiteNotesResponseSchema } from './schema';
import { processSiteNotes } from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/api/site-notes/process', {
    schema: {
      body: SiteNotesRequestSchema,
      response: { 200: SiteNotesResponseSchema },
    },
  }, async (request, reply) => {
    const result = await processSiteNotes(request.body);
    return reply.status(200).send(result);
  });
};

export default router;