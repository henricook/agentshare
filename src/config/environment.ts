import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.string().default('8721').transform(Number),
  STORAGE_PATH: z.string().default('./storage'),
  MAX_FILE_SIZE_MB: z.string().default('50').transform(Number),
  MAX_JSONL_LINES: z.string().default('10000000').transform(Number),
  CCLOGVIEWER_BIN_PATH: z.string().optional(),
  CCLOGVIEWER_TIMEOUT_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_UPLOAD_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_UPLOAD_MAX: z.string().default('10').transform(Number),
  RATE_LIMIT_VIEW_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_VIEW_MAX: z.string().default('100').transform(Number),
  BASE_URL: z.string().default('http://localhost:8721'),
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * @throws ZodError if validation fails
 * @returns Validated environment configuration
 */
export function getEnvironment(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration');
  }
}

export const env = getEnvironment();
