import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import type { ICommand } from '../../types/interfaces.js';

export const command: ICommand = {
	name: 'stop',
	category: 'music',
	description: '{COMMAND_STOP_DESCRIPTION}',
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

		if (queue.songs.length > 1) {
			const confirmButton = new ButtonBuilder()
				.setCustomId('stop-confirm')
				.setEmoji('✅')
				.setLabel(translate('COMMAND_STOP_CONFIRM_BUTTON_LABEL'))
				.setStyle(ButtonStyle.Danger);

			const cancelButton = new ButtonBuilder()
				.setCustomId('stop-cancel')
				.setEmoji('🚫')
				.setLabel(translate('COMMAND_STOP_CANCEL_BUTTON_LABEL'))
				.setStyle(ButtonStyle.Success);

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

			const description = translate('COMMAND_STOP_WARNING_MANY_SONGS', queue.songs.length.toString());
			await respond({ embeds: [{ description, color: 0xfbbc04 }], components: [row] });

			try {
				const selected = await interaction.channel!.awaitMessageComponent({
					filter: i => i.user.id === interaction.user.id && ['stop-confirm', 'stop-cancel'].includes(i.customId),
					componentType: ComponentType.Button,
					time: 30e3
				});

				if (selected.customId === 'stop-confirm') {
					const stoppedTrackName = queue.songs.at(0)?.name;
					const stoppedCount = queue.songs.length.toString();

					await queue.stop();

					const description = translate('COMMAND_STOP_STOPPED_MANY', stoppedTrackName, stoppedCount);
					await respond({ embeds: [{ description, color: 0x39ff84 }], components: [] });
				} else {
					const description = translate('COMMAND_STOP_CANCELLED');
					await respond({ embeds: [{ description, color: 0x39ff84 }], components: [] });
				}
			} catch {
				const description = translate('COMMAND_STOP_TIMEOUT');
				return respond({ embeds: [{ description, color: 0xff1f4f }], components: [] });
			}
		} else {
			const stoppedTrackName = queue.songs.at(0)?.name;
			await queue.stop();

			const description = translate('COMMAND_STOP_STOPPED_LAST', stoppedTrackName);
			return respond({ embeds: [{ description, color: 0x39ff84 }] });
		}
	}
};
