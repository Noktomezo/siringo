import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ClusterManager } from 'discord-hybrid-sharding';
import { env } from './env.js';

const manager = new ClusterManager(`${dirname(fileURLToPath(import.meta.url))}/index.js`, {
	token: env.DISCORD_TOKEN,
	shardsPerClusters: 2,
	totalShards: 'auto',
	mode: 'worker',
	respawn: true
});

await manager.spawn({ timeout: -1 });
