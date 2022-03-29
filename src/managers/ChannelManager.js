const CacheManager = require('./CacheManager');
const { Channel } = require('discord.js');

module.exports = class ChannelManager extends CacheManager {

    #c;
    constructor(channels, customEntries = null) {
        super(customEntries ?? [...channels?.cache?.entries()], Channel, channels);
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

}