import type { ChatInputCommandInteraction } from 'discord.js';
import type { Queue, Song } from 'distube';
import type { Siringo } from '../../core/Siringo.js';
import type { IEvent } from '../../types/interfaces.js';

export const event: IEvent = {
	name: 'addSong',
	run: async (client: Siringo, queue: Queue, song: Song) => {
		if (queue.songs.length < 2) return;

		const interaction = song.metadata as ChatInputCommandInteraction;
		const track = song.name ?? '';

		const description = client.locales.translate('EVENT_MUSIC_ADDSONG_QUEUED', queue.id, track);
		await interaction.editReply({ embeds: [{ color: 0x39ff84, description }] });
	}
};
