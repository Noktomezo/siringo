export const RE_MONGODB_URL = /^mongodb(\+srv)?:\/\/(\w+):(\w+)@(\w+)\.(\w+)\.(mongodb\.net)(\/(\w+))?$/;

export const RE_DISCORD_GUILD_EMOJI = /<a?:\w+:(\d+)>/;

export const RE_UNICODE_EMOJI = /\p{Emoji}/u;

export const RE_URL = new RegExp(
	'^(https?:\\/\\/)?' +
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
		'((\\d{1,3}\\.){3}\\d{1,3}))' +
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
		'(\\?[;&a-z\\d%_.~+=-]*)?' +
		'(\\#[-a-z\\d_]*)?$',
	'i'
);
