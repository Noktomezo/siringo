import { ApplicationCommandOptionType } from 'discord.js';
import type { ICommand } from '../../types/interfaces.js';

export const command: ICommand = {
	name: 'swipe',
	category: 'music',
	description: '{COMMAND_SWIPE_DESCRIPTION}',
	options: [
		{
			name: 'seconds',
			description: '{COMMAND_SWIPE_SECONDS_OPTION_DESCRIPTION}',
			type: ApplicationCommandOptionType.Integer
		}
	],
	async run({ client, interaction, respond, translate }) {
		const seconds = interaction.options.getInteger('seconds', false) ?? 5;
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

		const currentTrack = queue.songs.at(0)!;
		const setTime = queue.currentTime + seconds;
		const newTrackTime = setTime < 0 ? 0 : setTime > currentTrack.duration ? currentTrack.duration : setTime;

		queue.seek(newTrackTime);

		if (newTrackTime < 0) {
			const description = translate('COMMAND_SWIPE_TRACK_RESTARTED');
			await respond({ embeds: [{ description, color: 0x39ff84 }] });
		} else if (newTrackTime > currentTrack.duration) {
			const description = translate('COMMAND_SWIPE_TRACK_FINISHED');
			await respond({ embeds: [{ description, color: 0x39ff84 }] });
		} else if (setTime > queue.currentTime) {
			const description = translate('COMMAND_SWIPE_SWIPED_FORWARD', Math.abs(seconds));
			await respond({ embeds: [{ description, color: 0x39ff84 }] });
		} else {
			const description = translate('COMMAND_SWIPE_SWIPED_BACK', Math.abs(seconds));
			await respond({ embeds: [{ description, color: 0x39ff84 }] });
		}
	}
};
