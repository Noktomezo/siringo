import type { VoiceChannel } from 'discord.js';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import type { ICommand } from '../../types/interfaces.js';

export const command: ICommand = {
	name: 'add-private-channel-trigger',
	category: 'admin',
	description: '{COMMAND_APCT_DESCRIPTION}',
	options: [
		{
			name: 'private-channel-trigger',
			type: ApplicationCommandOptionType.Channel,
			description: '{COMMAND_APCT_OPTION_CHANNEL_DESCRIPTION}',
			required: true,
			channelTypes: [ChannelType.GuildVoice]
		},
		{
			name: 'private-channel-name',
			type: ApplicationCommandOptionType.String,
			description: '{COMMAND_APCT_OPTION_PRIVATE_CHANNEL_NAME}',
			required: false,
			minLength: 1
		}
	],
	async run({ client, interaction, respond, translate, settings }) {
		const voiceChannel: VoiceChannel = interaction.options.getChannel('private-channel-trigger', true);
		const privateChannelName = interaction.options.getString('private-channel-name', false);
		if (settings.pcts.some(t => t.id === voiceChannel.id)) {
			const description = translate('COMMAND_APCT_ALREADY_ADDED');
			return respond({ embeds: [{ color: 0xfbbc04, description }] });
		}

		if (!voiceChannel.parent?.id) {
			const description = translate('COMMAND_APCT_NO_CATEGORY');
			return respond({ embeds: [{ color: 0xfbbc04, description }] });
		}

		client.privateChannels.add(voiceChannel, privateChannelName);

		const description = translate('COMMAND_APCT_TRIGGER_ASSIGNED', `<#${voiceChannel.id}>`);
		return respond({ embeds: [{ color: 0x52ae5e, description }] });
	}
};
