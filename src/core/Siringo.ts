import type { EventEmitter } from 'node:events';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { cwd } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ClusterClient } from 'discord-hybrid-sharding';
import { Client } from 'discord.js';
import { DisTube, StreamType } from 'distube';
import { env } from '../env.js';
import type { IEvent, ISiringoOptions } from '../types/interfaces.js';
import type { TLocaleCode } from '../types/types.js';
import { Logger } from '../utils/logger.js';
import { getDefaultSettings } from '../utils/utils.js';
import { Database } from './Database.js';
import { CommandManager } from './managers/CommandManager.js';
import { LocaleManager } from './managers/LocaleManager.js';
import { PresenceManager } from './managers/PresenceManager.js';
import { PrivateChannelManager } from './managers/PrivateChannelManager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class Siringo<Ready extends boolean = boolean> extends Client<Ready> {
	public cluster: ClusterClient<this> | null;

	public locale: TLocaleCode;

	public player: DisTube;

	public logger: Logger;

	public database: Database;

	public locales: LocaleManager;

	public commands: CommandManager;

	public presences: PresenceManager;

	public privateChannels: PrivateChannelManager;

	public constructor(_options: ISiringoOptions) {
		super(getDefaultSettings());

		this.locale = _options.locale ?? 'en-US';

		this.logger = new Logger();
		this.player = new DisTube(this, {
			streamType: StreamType.OPUS,
			leaveOnEmpty: true,
			leaveOnFinish: true,
			leaveOnStop: true,
			emptyCooldown: 0
		});

		this.database = new Database(env.MONGO_CONNECTION_URL, {
			locale: 'en-US',
			pcts: [],
			rrs: []
		});

		this.locales = new LocaleManager(this, join(cwd(), 'locales'));
		this.commands = new CommandManager(this, join(__dirname, '..', 'commands'));

		this.cluster = env.NODE_ENV === 'development' ? null : new ClusterClient(this);
		this.privateChannels = new PrivateChannelManager(this);
		this.presences = new PresenceManager(this, 'idle');
	}

	public async handleEvents(eventFolder: string, eventManager: EventEmitter) {
		for (const eventFile of await readdir(eventFolder)) {
			const eventFilePath = join(eventFolder, eventFile);

			const eventFileURL = pathToFileURL(eventFilePath).toString();
			const { event }: { event: IEvent } = await import(eventFileURL);
			if (!event) continue;

			eventManager[event.once ? 'once' : 'on'](event.name, (...args) => event.run(this, ...args));
		}
	}

	public async init(token: string) {
		const clientListenerFolderPath = join(__dirname, '..', 'events', 'client');
		const databaseListenerFolderPath = join(__dirname, '..', 'events', 'database');
		const playerListenerFolderPath = join(__dirname, '..', 'events', 'player');

		await this.handleEvents(clientListenerFolderPath, this);
		await this.handleEvents(databaseListenerFolderPath, this.database);
		await this.handleEvents(playerListenerFolderPath, this.player);

		await this.login(token);
	}
}
