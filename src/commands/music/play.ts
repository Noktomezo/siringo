import { ActionRowBuilder, ApplicationCommandOptionType, StringSelectMenuBuilder, ComponentType } from 'discord.js';
import type { DisTubeError } from 'distube';
import type { ICommand } from '../../types/interfaces.js';
import { isURL } from '../../utils/utils.js';

export const command: ICommand = {
	name: 'play',
	category: 'music',
	description: '{COMMAND_PLAY_DESCRIPTION}',
	options: [
		{
			name: 'query',
			description: '{COMMAND_PLAY_QUERY_OPTION_DESCRIPTION}',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'first',
			description: '{COMMAND_PLAY_FIRST_OPTION_DESCRIPTION}',
			type: ApplicationCommandOptionType.Boolean,
			required: false
		},
		{
			name: 'force',
			description: '{COMMAND_PLAY_FORCE_OPTION_DESCRIPTION}',
			type: ApplicationCommandOptionType.Boolean,
			required: false
		}
	],
	async run({ client, interaction, respond, translate }) {
		const query = interaction.options.getString('query', true);
		const first = interaction.options.getBoolean('first', false);
		const force = interaction.options.getBoolean('force', false);

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

		try {
			await interaction.deferReply({ fetchReply: true });

			if (isURL(query) || first) {
				await client.player.play(member.voice.channel, query, { metadata: interaction });
			} else {
				const results = await client.player.search(query, { limit: 10, safeSearch: false });
				if (!results.length) {
					const description = translate('COMMAND_PLAY_NO_RESULTS');
					await respond({ embeds: [{ description, color: 0xfbbc04 }], ephemeral: true });
					return;
				}

				const selectMenu = new StringSelectMenuBuilder()
					.setOptions(results.map(t => ({ label: t.name, value: t.url })))
					.setPlaceholder(translate('COMMAND_PLAY_SELECT_PLACEHOLDER'))
					.setCustomId('track-select');

				const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
				await respond({ components: [row], ephemeral: true });

				const selected = await interaction.channel?.awaitMessageComponent({
					filter: i => i.user.id === interaction.user.id && i.customId === selectMenu.data.custom_id,
					componentType: ComponentType.StringSelect,
					time: 30e3
				});

				const selectedTrack = results.find(t => t.url === selected?.values.at(0));
				await client.player.play(member.voice.channel!, selectedTrack!, { metadata: interaction });
			}

			const updatedQueue = client.player.getQueue(interaction);
			if (updatedQueue && updatedQueue.songs.length > 1 && force)
				await updatedQueue.jump(updatedQueue.songs.length - 1);
		} catch (_error) {
			const { message, code } = _error as DisTubeError<''>;

			if (code === 'InteractionCollectorError') {
				const description = translate('COMMAND_PLAY_TIMEOUT');
				return respond({ embeds: [{ description, color: 0xff1f4f }], components: [] });
			}

			const description = translate('COMMAND_PLAY_UNEXPECTED_ERROR', message);
			return respond({ embeds: [{ description, color: 0xff1f4f }], components: [] });
		}
	}
};
