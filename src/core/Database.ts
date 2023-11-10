import { setTimeout } from 'node:timers';
import type { Snowflake } from 'discord.js';
import { Collection } from 'discord.js';
import Keyv from 'keyv';
import { get, set, unset } from 'lodash-es';
import { TypedEmitter } from 'tiny-typed-emitter';
import type { IDatabaseEvents, IGuildSettings } from '../types/interfaces.js';

export class Database extends TypedEmitter<IDatabaseEvents> {
	private readonly _keyv: Keyv<IGuildSettings>;

	private readonly _cache: Collection<Snowflake, IGuildSettings>;

	public constructor(
		private readonly _url: string,
		private readonly _defaults: IGuildSettings
	) {
		super();

		this._keyv = new Keyv<IGuildSettings>(this._url);
		this._cache = new Collection<Snowflake, IGuildSettings>();
		this._cache.tap(async () => this._update());
	}

	public set(key: Snowflake, value: IGuildSettings, ttl?: number) {
		void this._keyv.set(key, value, ttl);
		void this._cache.set(key, value);

		if (ttl && ttl >= 0) setTimeout(() => this._cache.delete(key), ttl);
	}

	public get(): Collection<Snowflake, IGuildSettings>;
	public get(key: Snowflake): IGuildSettings | undefined;
	public get(key?: Snowflake) {
		if (key) return this._cache.get(key);
		return this._cache.clone();
	}

	/**
	 * Fetches data from the database, updates the local cache, and returns the fetched data.
	 *
	 * @param key - Optional. The Snowflake key of the data to fetch. If not provided, fetches all data.
	 * @returns If a key is provided, returns a Promise resolving to the fetched data of type IGuildSettings or undefined if not found.
	 *          If no key is provided, returns a Promise resolving to a Collection of all data of type IGuildSettings.
	 */
	public async fetch(): Promise<Collection<Snowflake, IGuildSettings>>;
	public async fetch(key: Snowflake): Promise<IGuildSettings | undefined>;
	public async fetch(key?: Snowflake) {
		if (key) return this._keyv.get(key);

		const settingCollection = new Collection<Snowflake, IGuildSettings>();
		for await (const [guildId, settings] of this._keyv.iterator()) {
			this._cache.set(guildId, settings);
			settingCollection.set(guildId, settings);
		}

		return settingCollection;
	}

	/**
	 *	Fetches data from the database, caches it, and fixes broken segments.
	 * Also emits a 'ready' event when the update is complete
	 */
	private async _update() {
		await this.fetch();

		for (const [guildId, settings] of this._cache.entries()) {
			const repairedSettings = this._repair(settings);
			if (repairedSettings !== settings) this.set(guildId, repairedSettings);
		}

		this.emit('ready', this._cache.clone());
	}

	/**
	 * Repairs the database segment according to the default parameters
	 * (removes unnecessary values and adds missing values)
	 *
	 * @param brokenSettings - Invalid database segment mismatched type {@link IGuildSettings}
	 * @returns Repaired database segment matching the {@link IGuildSettings} type.
	 * @example
	 * ```ts
	 * const brokenSettings = this.get('some-guild-id')
	 * console.log(brokenSettings) // {locale: 'en-US', ..., wrongSetting: null}
	 *
	 * const repairedSettings = this._repair(brokenSettings)
	 * console.log(repairedSettings) // {locale: 'en-US', ..., correctSetting: 777}
	 * ```
	 */
	private _repair(brokenSettings?: Partial<IGuildSettings>) {
		if (!brokenSettings) return this._defaults;

		const defaultKeys = Object.keys(this._defaults);
		const customKeys = Object.keys(brokenSettings);

		const missingKeys = defaultKeys.filter(key => !customKeys.includes(key));
		const additionalKeys = customKeys.filter(key => !defaultKeys.includes(key));

		const repairedObj = structuredClone(brokenSettings);

		for (const key of missingKeys) {
			set(repairedObj, key, get(this._defaults, key));
		}

		for (const key of additionalKeys) {
			unset(repairedObj, key);
		}

		return repairedObj as IGuildSettings;
	}
}
