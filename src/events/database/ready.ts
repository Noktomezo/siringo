import type { Collection, Snowflake } from 'discord.js';
import type { Siringo } from '../../core/Siringo.js';
import type { IEvent, IGuildSettings } from '../../types/interfaces.js';

export const event: IEvent = {
	name: 'ready',
	once: true,
	run: (client: Siringo, data: Collection<Snowflake, IGuildSettings>) => {
		const message = client.locales.translate('EVENT_DATABASE_READY_UPDATED', client.locale, data.size.toString());
		client.logger.info(message);
	}
};
