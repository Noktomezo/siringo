import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Collection, type Snowflake } from 'discord.js';
import { TypedEmitter } from 'tiny-typed-emitter';
import { isLocaleCode, isLocaleCollection, isLocaleJSON, isSnowflake } from '../../types/guards.js';
import type { ILocaleManagerEvents } from '../../types/interfaces.js';
import type { TLocaleCode, TLocaleCollection, TLocaleResolvable } from '../../types/types.js';
import { createCollectionFromJSON, importJSON } from '../../utils/utils.js';
import type { Siringo } from '../Siringo.js';

export class LocaleManager extends TypedEmitter<ILocaleManagerEvents> {
	private readonly _locales: Collection<TLocaleCode, TLocaleCollection>;

	private readonly _cache: Collection<Snowflake, TLocaleCollection>;

	public constructor(
		public client: Siringo,
		public localeFolderPath: string
	) {
		super();
		this._locales = new Collection<TLocaleCode, TLocaleCollection>();
		this._cache = new Collection<Snowflake, TLocaleCollection>();
		this._cache.tap(async () => this._handle());
		this.client.database.on('ready', () => this.fetch());
	}

	public get allowed() {
		return [...this._locales.keys()];
	}

	public get default() {
		return this._locales.get(this.client.locale) as TLocaleCollection;
	}

	public async _handle() {
		for (const localeFile of await readdir(this.localeFolderPath)) {
			const localeFilePath = join(this.localeFolderPath, localeFile);
			const localeCode = localeFile.split('.')[0] as TLocaleCode;
			const localeJSON = await importJSON(localeFilePath);
			if (!localeJSON) continue;

			this._locales.set(localeCode, createCollectionFromJSON(localeJSON));
		}

		this.emit('handled', this._locales);
	}

	public translate(translatable: string, localeResolvable: TLocaleResolvable, ...replaceable: string[]) {
		const locale = this.resolve(localeResolvable);
		if (!locale) return translatable;

		const fixedTranslatable = translatable.replace(/{(.+)}/, '$1');
		let translated = locale.get(fixedTranslatable) ?? fixedTranslatable;

		if (replaceable) {
			for (const [index, element] of replaceable.entries()) {
				const REPLACE_RE = new RegExp(`\\{${index}\\}`, 'g');
				translated = translated.replace(REPLACE_RE, element);
			}
		}

		return translated;
	}

	public fetch() {
		const guildLocales = new Collection<Snowflake, TLocaleCollection>();
		for (const [guildId, settings] of this.client.database.get()) {
			const locale = this._locales.get(settings.locale)!;
			guildLocales.set(guildId, locale);
			this._cache.set(guildId, locale);
		}

		return guildLocales;
	}

	public resolve(resolvable: TLocaleResolvable) {
		if (isLocaleCollection(resolvable)) return resolvable;
		if (isSnowflake(resolvable)) return this._cache.get(resolvable)!;
		if (isLocaleCode(resolvable)) return this._locales.get(resolvable)!;
		if (isLocaleJSON(resolvable)) return createCollectionFromJSON(resolvable);
		return null;
	}

	public resolveCode(resolvable: TLocaleResolvable) {
		const locale = this.resolve(resolvable);
		return this._locales.findKey(v => v === locale);
	}
}
