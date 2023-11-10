import type { Siringo } from '../../core/Siringo.js';
import type { IEvent } from '../../types/interfaces.js';

export const event: IEvent = {
	name: 'ready',
	once: true,
	run: (client: Siringo<true>) => {
		const message = client.locales.translate('EVENT_CLIENT_READY_LOGGED_IN', client.locale, client.user.tag);
		client.logger.info(message);
	}
};
