const CacheManager = require('./CacheManager');
const TextChannel = require('../structures/TextChannel');
const TextBasedChannel = require('../structures/TextBasedChannel');
const VoiceChannel = require('../structures/VoiceChannel');
const VoiceBasedChannel = require('../structures/VoiceBasedChannel');
const GuildChannelInterface = require('../structures/GuildChannelInterface');
const { Channel } = require('discord.js');

module.exports = class ChannelManager extends CacheManager {

    #c;
    constructor(channels, customEntries = null) {
        super(customEntries ?? [...(channels?.cache?.entries() ?? [])].map(([id, channel]) => {
            return [id, ChannelManager.resolveFrom(channels?.client, channel)];
        }), Channel, channels);
        this.#c = channels;
    }

    #filter(...types) {
        return new ChannelManager(this.#c, [...this.filter(c => types.includes("" + c.type)).entries()]);
    }

    get text() {
        return this.#filter("GUILD_TEXT");
    }

    get textBased() {
        return this.#filter("GUILD_TEXT", "DM", "GROUP_DM", "GUILD_NEWS");
    }

    get dm() {
        return this.#filter("DM", "GROUP_DM");
    }

    get voice() {
        return this.#filter("GUILD_VOICE");
    }

    get voiceBased() {
        return this.#filter("GUILD_VOICE", "GUILD_STAGE_VOICE");
    }

    get category() {
        return this.#filter("GUILD_CATEGORY");
    }

    get news() {
        return this.#filter("GUILD_NEWS");
    }

    // TODO: threads prop

    get stage() {
        return this.#filter("GUILD_STAGE_VOICE");
    }

    get unknown() {
        return this.#filter("UNKNOWN");
    }

    delete(idOrChannel, reason = null) {
        const channel = /** @type {import("discord.js").Channel} */ (this.resolve(idOrChannel));
        return channel?.delete(reason);
    }

    static resolveFrom(client, baseChannel) {
        let channel = baseChannel;
        if (!baseChannel) return null;
        else if (baseChannel instanceof TextBasedChannel || baseChannel instanceof VoiceBasedChannel) return baseChannel;
        else if (baseChannel.isThread()) return baseChannel;
        else if (baseChannel.type == "GUILD_TEXT") channel = new TextChannel(client, baseChannel);
        else if (baseChannel.isText()) {
            class GuildTextBasedChannel extends TextBasedChannel { constructor(...args) { super(...args) } };
            if (baseChannel.guild) GuildChannelInterface.applyToClass(GuildTextBasedChannel);

            channel = new (baseChannel.guild ? GuildTextBasedChannel : TextBasedChannel)(client, baseChannel);
        }
        else if (baseChannel.type == "GUILD_VOICE") channel = new VoiceChannel(client, baseChannel);
        else if (baseChannel.isVoice()) {
            class GuildVoiceBasedChannel extends VoiceBasedChannel { constructor(...args) { super(...args) } };
            if (baseChannel.guild) GuildChannelInterface.applyToClass(GuildVoiceBasedChannel);

            channel = new (baseChannel.guild ? GuildVoiceBasedChannel : VoiceBasedChannel)(client, baseChannel);
        }

        return channel;
    }

}