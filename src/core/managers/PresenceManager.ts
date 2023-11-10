import { setTimeout as sleep } from 'node:timers/promises';
import type { ActivitiesOptions, PresenceStatusData } from 'discord.js';
import type { Siringo } from '../Siringo.js';

export class PresenceManager {
	public constructor(
		public client: Siringo,
		public status: PresenceStatusData = 'dnd',
		public activities: ActivitiesOptions[] = []
	) {
		this.client.once('ready', async () => this._setUpdateInterval(5_000));
	}

	private _update(status: PresenceStatusData, activity?: ActivitiesOptions) {
		if (activity) return this.client.user?.setPresence({ status, activities: [activity] });
		return this.client.user?.setStatus(status);
	}

	private async _setUpdateInterval(ms: number) {
		this._update(this.status, this.activities[0]);

		for (let i = 0; i < this.activities.length; i++) {
			if (i === this.activities.length - 1) i = 0;

			this._update(this.status, this.activities[i]!);
			await sleep(ms);
		}
	}
}
