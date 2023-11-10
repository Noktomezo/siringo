import process from 'node:process';
import { z } from 'zod';
import 'dotenv/config';
import { isLocaleCode } from './types/guards.js';
import type { IZodParsedError } from './types/interfaces.js';
import type { TLocaleCode } from './types/types.js';
import { Logger } from './utils/logger.js';
import { isMongoConnectionURL } from './utils/utils.js';

enum InvalidEnvVar {
	DEFAULT_LOCALE = 'DEFAULT_LOCALE must be one of this: ru, en-US',
	DISCORD_TOKEN = 'DISCORD_TOKEN variable must be type of string',
	MONGO_CONNECTION_URL = 'MONGO_CONNECTION_URL variable does not look like a MongoDB connection link'
}

const envSchema = z.object({
	DEFAULT_LOCALE: z.custom<TLocaleCode>().refine(isLocaleCode, InvalidEnvVar.DEFAULT_LOCALE),
	DISCORD_TOKEN: z.string({ invalid_type_error: InvalidEnvVar.DISCORD_TOKEN }),
	MONGO_CONNECTION_URL: z.string().refine(isMongoConnectionURL, InvalidEnvVar.MONGO_CONNECTION_URL),
	NODE_ENV: z.enum(['development', 'production']).default('development')
});

const logger = new Logger();
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	const parsedErrors = JSON.parse(parsed.error.message) as IZodParsedError[];
	logger.error(parsedErrors[0]?.message);
	process.exit(1);
}

export const env = parsed.data;
