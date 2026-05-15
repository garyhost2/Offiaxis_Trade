import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateExpenseSchema,
  CreateIncomeSchema,
  ExpenseResponseSchema,
  IncomeResponseSchema,
  ProfitLossSummarySchema,
} from './schema';
import {
  createExpenseService,
  listExpensesService,
  createIncomeService,
  listIncomeService,
  getProfitLossSummary,
  getBreakdown,
} from './service';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/api/profit-loss/expenses', {
    schema: {
      body: CreateExpenseSchema,
      response: { 201: ExpenseResponseSchema },
    },
  }, async (request, reply) => {
    const expense = await createExpenseService(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(expense);
  });

  fastify.get('/api/profit-loss/expenses', {
    schema: {
      querystring: z.object({
        projectId: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
      response: { 200: z.array(ExpenseResponseSchema) },
    },
  }, async (request, reply) => {
    const expenses = await listExpensesService({
      orgId: request.user.orgId,
      ...request.query,
    });
    return reply.status(200).send(expenses);
  });

  fastify.post('/api/profit-loss/income', {
    schema: {
      body: CreateIncomeSchema,
      response: { 201: IncomeResponseSchema },
    },
  }, async (request, reply) => {
    const income = await createIncomeService(
      request.user.orgId,
      request.user.uid,
      request.body
    );
    return reply.status(201).send(income);
  });

  fastify.get('/api/profit-loss/income', {
    schema: {
      querystring: z.object({
        projectId: z.string().optional(),
      }),
      response: { 200: z.array(IncomeResponseSchema) },
    },
  }, async (request, reply) => {
    const income = await listIncomeService({
      orgId: request.user.orgId,
      projectId: request.query.projectId,
    });
    return reply.status(200).send(income);
  });

  fastify.get('/api/profit-loss/summary', {
    schema: {
      querystring: z.object({
        projectId: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
      response: { 200: ProfitLossSummarySchema },
    },
  }, async (request, reply) => {
    const summary = await getProfitLossSummary({
      orgId: request.user.orgId,
      ...request.query,
    });
    return reply.status(200).send(summary);
  });

  fastify.get('/api/profit-loss/breakdown', {
    schema: {
      querystring: z.object({
        projectId: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        jobType: z.string().optional(),
      }),
      response: {
        200: z.array(z.object({ category: z.string(), total: z.number() })),
      },
    },
  }, async (request, reply) => {
    const breakdown = await getBreakdown({
      orgId: request.user.orgId,
      ...request.query,
    });
    return reply.status(200).send(breakdown);
  });
};

export default router;
