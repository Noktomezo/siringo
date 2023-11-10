import type { DisTubeError } from 'distube';
import type { Siringo } from '../../core/Siringo.js';
import type { IEvent } from '../../types/interfaces.js';

export const event: IEvent = {
	name: 'error',
	run: (client: Siringo, error: DisTubeError<''>) => {
		client.logger.error(error);
	}
};
