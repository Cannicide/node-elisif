const ExtendedStructure = require('./ExtendedStructure');
const Timestamp = require('./Timestamp');
const { boa, guilds } = require('../util');
const { VoiceChannel: BaseVBC } = require("discord.js");

/**
 * @extends {ExtendedStructure}
 * @extends {BaseVBC}
 */
module.exports = class VoiceBasedChannel extends ExtendedStructure {

    /** @type {BaseVBC} */
    #c;
    constructor(client, channel) {
        super(client, channel);
        this.#c = channel;
    }

    get mention() {
        return `<#${this.#c.id}>`;
    }

    get created() {
        return new Timestamp(this.#c.createdAt, this.#c.createdTimestamp);
    }

    get members() {
        const GuildMemberManager = require('../managers/GuildMemberManager');
        return new GuildMemberManager({ cache: this.#c.members, client: this.client });
    }

    get type() {
        const ChannelTypeManager = require('../managers/ChannelTypeManager');
        return new ChannelTypeManager(this.#c);
    }

    channelOf(idOrGuild) {
        if (idOrGuild instanceof ExtendedStructure && idOrGuild.channel) return this.is(idOrGuild.channel);
        return guilds(this.client).resolve(idOrGuild)?.channels.has(this.#c.id);
    }

    isEmpty() {
        return this.#c.members.size == 0;
    }
    
    async delete({ timeout = 0, filter = () => true } = {}) {
        if (filter(this)) {
            await boa.wait(timeout);
            return this.#c.delete();
        }
        return null;
    }

    [Symbol.toPrimitive](hint) {
        if (hint == "string" || hint == "default") return this.mention;
        return Number(this.#c.id);
    }

    get [Symbol.toStringTag]() {
        return this.mention;
    }

}