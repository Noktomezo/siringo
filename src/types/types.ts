import type { Locale, Collection, Snowflake } from 'discord.js';
import type { ICommand } from './interfaces.js';

export type TLocaleCode = `${Locale}`;

export type TLocaleJSON = Record<string, string>;

export type TLocaleCollection = Collection<string, string>;

export type TLocaleResolvable = Snowflake | TLocaleCode | TLocaleCollection | TLocaleJSON;

export type TCommandResolvable = ICommand | string;
