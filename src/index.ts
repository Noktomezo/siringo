import { Siringo } from './core/Siringo.js';
import { env } from './env.js';

const client = new Siringo({
	mongoConnectionURL: env.MONGO_CONNECTION_URL,
	locale: env.DEFAULT_LOCALE
});

await client.init(env.DISCORD_TOKEN);
