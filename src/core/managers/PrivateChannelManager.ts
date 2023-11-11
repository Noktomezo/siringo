import { ChannelType, PermissionFlagsBits } from 'discord.js';
import type { VoiceChannel, VoiceState } from 'discord.js';
import { isEqual, remove, unionWith } from 'lodash-es';
import type { IPrivateChannel, IPrivateChannelTrigger } from '../../types/interfaces.js';
import type { Siringo } from '../Siringo.js';

export class PrivateChannelManager {
	public constructor(public client: Siringo) {
		this.client.database.once('ready', async () => this.update());
		this.client.on('voiceStateUpdate', async (o, n) => this._handleVoiceStateUpdate(o, n));
	}

	public add(voiceChannel: VoiceChannel, channelName?: string | null) {
		const settings = this.client.database.get(voiceChannel.guild.id);
		if (!settings) return;

		const trigger: IPrivateChannelTrigger = { id: voiceChannel.id };
		if (channelName) trigger.ownedChannelName = channelName;

		settings.pcts = unionWith(settings.pcts, [trigger], isEqual);
		this.client.database.set(voiceChannel.guild.id, settings);
	}

	public remove(voiceChannel: VoiceChannel) {
		const settings = this.client.database.get(voiceChannel.guild.id);
		if (!settings) return;

		remove(settings.pcts, t => t.id === voiceChannel.id);

		this.client.database.set(voiceChannel.guild.id, settings);
	}

	public async update() {
		await this.client.guilds.fetch();

		for (const [guildId, settings] of this.client.database.get()) {
			const guild = this.client.guilds.cache.get(guildId);
			if (!guild || !settings.pcts.length) continue;

			const filteredSettings = structuredClone(settings);
			remove(filteredSettings.pcts, t => !guild.channels.cache.has(t.id));

			for (const pct of filteredSettings.pcts) {
				if (!pct.ownedChannels) continue;
				remove(pct.ownedChannels, c => !guild.channels.cache.has(c.id));
			}

			if (!isEqual(filteredSettings, settings)) {
				this.client.database.set(guild.id, filteredSettings);
			}
		}
	}

	private async _handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
		const settings = this.client.database.get(newState.guild.id);
		if (!settings) return;

		const stgs = structuredClone(settings);

		if (newState.channel?.id && newState.channel.parent && newState.member && !newState.member.user.bot) {
			const triggerChannelData = stgs.pcts.find(t => t.id === newState.channelId);
			if (!triggerChannelData) return;

			const ownedChannel = await newState.guild.channels.create({
				permissionOverwrites: [{ id: newState.member.id, allow: PermissionFlagsBits.ManageChannels }],
				name: triggerChannelData.ownedChannelName ?? newState.member.displayName,
				parent: newState.channel.parentId,
				type: ChannelType.GuildVoice
			});

			await newState.setChannel(ownedChannel);

			const ownedChannelData: IPrivateChannel = { id: ownedChannel.id, triggerChannelId: newState.channel.id };
			const triggerInSettings = stgs.pcts[stgs.pcts.indexOf(triggerChannelData)];
			triggerInSettings!.ownedChannels = unionWith(triggerInSettings!.ownedChannels, [ownedChannelData], isEqual);
		}

		if (oldState.channel?.id) {
			const triggerInCategory = stgs.pcts.find(t => t.ownedChannels?.some(c => c.id === oldState.channel?.id));
			if (!triggerInCategory?.ownedChannels?.length) return;

			for (const ownedChannelData of triggerInCategory.ownedChannels) {
				const ownedChannel = oldState.guild.channels.cache.get(ownedChannelData.id) as VoiceChannel;
				if (!ownedChannel) continue;

				const isChannelEmpty = ownedChannel.members.filter(m => !m.user.bot).size === 0;
				if (!isChannelEmpty || !ownedChannel.deletable) continue;

				await ownedChannel.delete();
				remove(triggerInCategory.ownedChannels, c => c.id === ownedChannel.id);
			}
		}

		if (!isEqual(stgs, settings)) this.client.database.set(oldState.guild.id, stgs);
	}
}
