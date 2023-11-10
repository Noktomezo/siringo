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
		const voiceState = oldState.channel?.id ? oldState : newState;
		if (!voiceState.member || voiceState.member.user.bot) return;

		const settings = this.client.database.get(voiceState.guild.id);
		if (!settings?.pcts.length) return;

		if (isEqual(voiceState, newState)) {
			const trigger = settings.pcts.find(c => c.id === voiceState.channel?.id);
			if (!trigger) return;

			const triggerVoiceChannel = voiceState.guild.channels.cache.get(trigger.id) as VoiceChannel;
			if (!triggerVoiceChannel) return;

			const ownedChannel = await voiceState.guild.channels.create({
				name: trigger.ownedChannelName ?? voiceState.member.displayName,
				parent: triggerVoiceChannel.parent,
				type: ChannelType.GuildVoice,
				permissionOverwrites: [
					{
						allow: PermissionFlagsBits.ManageChannels,
						id: voiceState.member.id
					}
				]
			});

			const ocd: IPrivateChannel[] = [{ id: ownedChannel.id, triggerChannelId: trigger.id }];
			const triggerInSettings = settings.pcts[settings.pcts.indexOf(trigger)];

			triggerInSettings!.ownedChannels = unionWith(triggerInSettings?.ownedChannels, ocd, isEqual);

			this.client.database.set(voiceState.guild.id, settings);
			await voiceState.setChannel(ownedChannel);
		} else {
			const category = voiceState.channel?.parent;
			if (!category) return;

			const trigger = settings.pcts.find(t => category.children.cache.some(c => c.id === t.id));
			if (!trigger) return;

			for (const channel of category.children.cache.values()) {
				const ownedChannelData = trigger.ownedChannels?.find(c => c.id === channel.id);
				if (!ownedChannelData) continue;

				const isChannelEmpty = channel.members.filter(m => !m.user.bot).size === 0;
				if (isChannelEmpty && channel.deletable) await channel.delete();
			}
		}
	}
}
