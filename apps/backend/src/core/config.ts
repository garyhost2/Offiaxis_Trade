import { z } from 'zod';

const envSchema = z.object({
  MONGO_URL: z.string().url(),
  DB_NAME: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_WEB_API_KEY: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  SENTRY_DSN: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8001'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
});

export type AppConfig = z.infer<typeof envSchema>;

function loadConfig(): AppConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${missing}`);
  }
  return result.data;
}

export const config: AppConfig = loadConfig();
