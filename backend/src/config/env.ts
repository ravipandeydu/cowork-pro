import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  HOST: z.string().default('localhost'),
  
  // Database
  MONGODB_URI: z.string().url(),
  MONGODB_TEST_URI: z.string().url().optional(),
  
  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('cowork-pro'),
  JWT_AUDIENCE: z.string().default('cowork-pro-users'),
  
  // Security
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),
  
  // API Documentation
  API_DOCS_ENABLED: z.string().transform(val => val === 'true').default('true'),
  API_DOCS_PATH: z.string().default('/api-docs'),
  API_VERSION: z.string().default('v1'),
  
  // Optional configurations
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('5242880'),
  UPLOAD_PATH: z.string().default('uploads/'),
});

// Validate and parse environment variables
const parseEnv = (): z.infer<typeof envSchema> => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(
        `Environment validation failed:\n${errorMessages.join('\n')}`
      );
    }
    throw error;
  }
};

export const env = parseEnv();

export type EnvConfig = typeof env;

// Helper functions
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';

// Database URI helper
export const getDatabaseUri = (): string => {
  if (isTest() && env.MONGODB_TEST_URI) {
    return env.MONGODB_TEST_URI;
  }
  return env.MONGODB_URI;
};