import type {
	ChatInputApplicationCommandData,
	ChatInputCommandInteraction,
	Collection,
	InteractionReplyOptions,
	Snowflake
} from 'discord.js';
import type { Siringo } from '../core/Siringo.js';
import type { TLocaleCode, TLocaleCollection } from './types.js';

export interface ISiringoOptions {
	locale?: TLocaleCode;
	mongoConnectionURL: string;
}

export interface IEvent {
	name: string;
	once?: boolean;
	run(client: Siringo, ...args: unknown[]): void;
}

export interface ICommand extends ChatInputApplicationCommandData {
	category: string;
	run(options: ICommandRunOptions): void;
}

export interface ICommandRunOptions {
	client: Siringo;
	interaction: ChatInputCommandInteraction;
	respond(data: InteractionReplyOptions, ttl?: number): Promise<void>;
	settings: IGuildSettings;
	translate(translatable: string, ...replaceable: unknown[]): string;
}

export interface IReactionRole {
	channelId: string;
	emojiId: string;
	messageId: string;
	roleId: string;
	type: string;
}

export interface IPrivateChannel {
	id: Snowflake;
	triggerChannelId: Snowflake;
}

export interface IPrivateChannelTrigger {
	id: Snowflake;
	ownedChannelName?: string;
	ownedChannels?: IPrivateChannel[];
}

export interface IGuildSettings {
	locale: TLocaleCode;
	pcts: IPrivateChannelTrigger[];
	rrs: IReactionRole[];
}

export interface IZodParsedError {
	code: string;
	message: string;
	path: string[];
}

export interface ILocaleManagerEvents {
	handled(locales: Collection<TLocaleCode, TLocaleCollection>): void;
	ready(): void;
}

export interface IDatabaseEvents {
	ready(data: Collection<Snowflake, IGuildSettings>): void;
}
