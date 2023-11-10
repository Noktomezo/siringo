import type { Guild, Snowflake } from 'discord.js';
import { Collection, Locale, SnowflakeUtil } from 'discord.js';
import type { ICommand } from './interfaces.js';
import type { TLocaleCode, TLocaleCollection, TLocaleJSON } from './types.js';

export function isObject(obj: any): obj is Object {
	return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function isLocaleCode(obj: any): obj is TLocaleCode {
	return Object.values(Locale).includes(obj);
}

export function isSnowflake(obj: any): obj is Snowflake {
	try {
		return SnowflakeUtil.deconstruct(obj).timestamp > SnowflakeUtil.epoch;
	} catch {
		return false;
	}
}

export function isNumber(obj: any): obj is number {
	return typeof obj === 'number';
}

export function isLocaleJSON(obj: any): obj is TLocaleJSON {
	return isObject(obj);
}

export function isLocaleCollection(obj: any): obj is TLocaleCollection {
	return obj instanceof Collection;
}

export function isGuildInstance(obj: any): obj is Guild {
	return Boolean(obj) && isSnowflake(obj.id) && isSnowflake(obj.ownerId) && typeof obj.name === 'string';
}

export function isCommand(obj: any): obj is ICommand {
	const reqProps: readonly string[] = ['name', 'description', 'category', 'run'];
	return Object.keys(obj).every(k => reqProps.includes(k)) && typeof (obj as ICommand).run === 'function';
}
