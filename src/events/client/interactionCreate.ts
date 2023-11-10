import { setTimeout as sleep } from 'node:timers/promises';
import type { Interaction, InteractionReplyOptions } from 'discord.js';
import type { Siringo } from '../../core/Siringo.js';
import type { IEvent } from '../../types/interfaces.js';

export const event: IEvent = {
	name: 'interactionCreate',
	run: (client: Siringo, interaction: Interaction) => {
		if (!interaction.isChatInputCommand() || !interaction.guild) return;

		const settings = client.database.get(interaction.guild.id)!;
		const command = client.commands.get(settings.locale, interaction.commandName);

		const translate = (translatable: string, ...replaceable: string[]) =>
			client.locales.translate(translatable, settings.locale, ...replaceable);

		const respond = async (data: InteractionReplyOptions, ttl?: number): Promise<void> => {
			if (!interaction.isAutocomplete() && interaction.deferred) {
				await interaction.editReply(data).catch(error => client.logger.error(error));
				return;
			}

			if (interaction.isRepliable()) {
				await interaction.reply(data).catch(error => client.logger.error(error));

				if (ttl) {
					await sleep(ttl);
					await interaction.deleteReply().catch(error => client.logger.error(error));
				}
			}
		};

		command?.run({ client, interaction, settings, translate, respond });
	}
};
