import type { ChatInputCommandInteraction } from 'discord.js';
import type { Queue, Song } from 'distube';
import type { Siringo } from '../../core/Siringo.js';
import type { IEvent } from '../../types/interfaces.js';

export const event: IEvent = {
	name: 'playSong',
	run: async (client: Siringo, queue: Queue, song: Song) => {
		const interaction = song.metadata as ChatInputCommandInteraction;
		const track = song.name ?? '';

		const description = client.locales.translate('EVENT_MUSIC_PLAYSONG_NOW_PLAYING', queue.id, track);
		return interaction.editReply({
			embeds: [{ color: 0x39ff84, description, thumbnail: { url: song.thumbnail ?? '' } }],
			components: []
		});
	}
};
