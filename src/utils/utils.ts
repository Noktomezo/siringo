import { readFile } from 'node:fs/promises';
import { getInfo } from 'discord-hybrid-sharding';
import { Partials, Collection, GatewayIntentBits, type ClientOptions } from 'discord.js';
import { env } from '../env.js';
import { RE_UNICODE_EMOJI, RE_MONGODB_URL, RE_URL, RE_DISCORD_GUILD_EMOJI } from './constants.js';

export function isJSON(str: string) {
	try {
		JSON.parse(str);
	} catch {
		return false;
	}

	return true;
}

export async function importJSON(jsonFilePath: string) {
	const jsonFile = await readFile(jsonFilePath, 'utf8');
	if (!isJSON(jsonFile)) return null;

	return JSON.parse(jsonFile) as Record<string, string>;
}

export function createCollectionFromJSON(json: Record<string, string>) {
	const collection = new Collection();

	for (const key in json) {
		if (Object.hasOwn(json, key)) {
			collection.set(key, json[key]);
		}
	}

	return collection as Collection<string, string>;
}

export function isURL(string: string) {
	return Boolean(RE_URL.test(string));
}

export function isMongoConnectionURL(url: string) {
	return Boolean(RE_MONGODB_URL.test(url));
}

export function isDefaultEmoji(emoji: string) {
	return RE_UNICODE_EMOJI.test(emoji);
}

export function isGuildEmoji(emoji: string) {
	return RE_DISCORD_GUILD_EMOJI.test(emoji);
}

export function isEmoji(emoji: string) {
	return isDefaultEmoji(emoji) || isGuildEmoji(emoji);
}

export function resolveEmojiId(emoji: string) {
	if (isDefaultEmoji(emoji)) return emoji;
	if (isGuildEmoji(emoji)) return emoji.replace(RE_DISCORD_GUILD_EMOJI, '$1');
	return null;
}

export function getAllIntents() {
	return Object.values(GatewayIntentBits).filter((g): g is GatewayIntentBits => typeof g === 'string');
}

export function getAllPartials() {
	return Object.values(Partials).filter((p): p is Partials => typeof p === 'string');
}

export function getShardCount() {
	return env.NODE_ENV === 'development' ? 1 : getInfo().TOTAL_SHARDS;
}

export function getShards() {
	return env.NODE_ENV === 'development' ? 'auto' : getInfo().SHARD_LIST;
}

export function getDefaultSettings() {
	return {
		shardCount: getShardCount(),
		partials: getAllPartials(),
		intents: getAllIntents(),
		shards: getShards()
	} as ClientOptions;
}
