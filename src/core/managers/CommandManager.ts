import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Collection } from 'discord.js';
import { isCommand } from '../../types/guards.js';
import type { ICommand } from '../../types/interfaces.js';
import type { TCommandResolvable, TLocaleCode, TLocaleResolvable } from '../../types/types.js';
import type { Siringo } from '../Siringo.js';

export class CommandManager {
	private readonly _commands: Collection<string, ICommand>;

	private readonly _translated: Collection<TLocaleCode, typeof this._commands>;

	public constructor(
		public client: Siringo,
		public commandFolderPath: string
	) {
		this._commands = new Collection<string, ICommand>();
		this._translated = new Collection<TLocaleCode, typeof this._commands>();
		this._commands.tap(async () => this._handle());
		this.client.database.once('ready', async () => this._update());
	}

	public get(localeResolvable: TLocaleResolvable, commandResolvable: TCommandResolvable) {
		const command = this.resolve(commandResolvable);
		if (!command) return null;

		const localeCode = this.client.locales.resolveCode(localeResolvable);
		if (!localeCode) return null;

		const commandCollection = this._translated.get(localeCode);
		if (!commandCollection) return null;

		return commandCollection.get(command.name) ?? null;
	}

	public resolve(commandResolvable: TCommandResolvable) {
		if (isCommand(commandResolvable)) return commandResolvable;
		return this._commands.get(commandResolvable) ?? null;
	}

	private async _handle() {
		for (const commandCategory of await readdir(this.commandFolderPath)) {
			const commandCategoryPath = join(this.commandFolderPath, commandCategory);

			for (const commandFile of await readdir(commandCategoryPath)) {
				const commandFilePath = join(commandCategoryPath, commandFile);

				const commandFileURL = pathToFileURL(commandFilePath).toString();
				const { command }: { command: ICommand } = await import(commandFileURL);
				if (!command) continue;

				this._commands.set(command.name, command);
			}
		}

		for (const code of this.client.locales.allowed) {
			const translatedCollection = new Collection<string, ICommand>();
			for (const [commandName, command] of this._commands.entries()) {
				const translatedCommand = this._translate(command, code);
				translatedCollection.set(commandName, translatedCommand);
			}

			this._translated.set(code, translatedCollection);
		}
	}

	private async _update() {
		await this.client.application?.commands.set([]);

		for (const [guildId, settings] of this.client.database.get()) {
			const guild = this.client.guilds.cache.get(guildId);
			if (!guild) continue;

			const commands = this._translated.get(settings.locale);
			if (commands) void guild.commands.set([...commands.values()]);
		}
	}

	private _translate(command: ICommand, localeResolvable: TLocaleResolvable) {
		const translate = (text: string) => this.client.locales.translate(text, localeResolvable);

		return {
			...command,
			description: translate(command.description),
			options:
				command.options?.map(option => ({
					...option,
					description: translate(option.description)
				})) ?? []
		} as ICommand;
	}
}
