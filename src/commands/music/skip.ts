import type { ICommand } from '../../types/interfaces.js';

export const command: ICommand = {
	name: 'skip',
	category: 'music',
	description: '{COMMAND_SKIP_DESCRIPTION}',
	async run({ client, interaction, respond, translate }) {
		const member = interaction.guild!.members.cache.get(interaction.user.id);
		const memberVoiceChannel = member?.voice.channel;
		const botVoiceChannel = interaction.guild!.members.me?.voice.channel;
		const queue = client.player.getQueue(interaction);

		if (!memberVoiceChannel) {
			const description = translate('MUSIC_NO_VOICE_CHANNEL');
			return respond({ embeds: [{ description, color: 0xfbbc04 }], ephemeral: true });
		}

		if (queue?.playing && memberVoiceChannel?.id !== botVoiceChannel?.id) {
			const description = translate('MUSIC_DIFFERENT_CHANNEL');
			return respond({ embeds: [{ description, color: 0xfbbc04 }], ephemeral: true });
		}

		if (!queue || (memberVoiceChannel?.id === botVoiceChannel?.id && !queue.playing)) {
			const description = translate('MUSIC_NOTHING_PLAYING');
			return respond({ embeds: [{ description, color: 0xfbbc04 }], ephemeral: true });
		}

		await interaction.deferReply();

		/**
		 * TODO: Skip several songs at once
		 */

		if (queue.songs.length > 1) {
			const skippedTrackName = queue.songs[0]?.name;

			await queue.skip();

			const description = translate('COMMAND_SKIP_SKIPPED', skippedTrackName);
			return respond({ embeds: [{ description, color: 0x39ff84 }] });
		} else {
			await queue.stop();

			const description = translate('COMMAND_SKIP_STOPPED');
			return respond({ embeds: [{ description, color: 0x39ff84 }] });
		}
	}
};
