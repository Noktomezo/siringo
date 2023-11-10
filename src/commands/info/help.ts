import type { ICommand } from '../../types/interfaces.js';

export const command: ICommand = {
	name: 'help',
	category: 'info',
	description: '{COMMAND_HELP_DESCRIPTION}',
	async run({ client, interaction, settings, respond }) {
		await respond({
			embeds: [
				{
					color: 0xfbbc04,
					description:
						'Sunt aliquip culpa veniam do cillum nisi cupidatat qui. ' +
						'Aliqua eiusmod reprehenderit culpa cillum excepteur dolore ' +
						'ullamco commodo sunt nisi Lorem eu exercitation. Ea ' +
						'pariatur esse cillum incididunt. Et cupidatat elit consequat ' +
						'sit ullamco sunt in. Reprehenderit excepteur magna aliqua ' +
						'aliqua laborum fugiat excepteur pariatur eiusmod officia ' +
						'anim laborum.'
				}
			]
		});
	}
};
