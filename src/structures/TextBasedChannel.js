const ExtendedStructure = require('./ExtendedStructure');
const Timestamp = require('./Timestamp');
const { asMessageOptions, boa, guilds } = require('../util');
const { DMChannel: BaseTBC, Message: BaseMessage, MessagePayload: APIMessage } = require("discord.js");

/**
 * @extends {ExtendedStructure}
 * @extends {BaseTBC}
 */
module.exports = class TextBasedChannel extends ExtendedStructure {

    /** @type {BaseTBC} */
    #c;
    constructor(client, channel) {
        super(client, channel);
        this.#c = channel;
    }

    get mention() {
        return this.#c.guild ? `<#${this.#c.id}>` : `<@${this.#c.recipient?.id}>`;
    }

    get created() {
        return new Timestamp(this.#c.createdAt, this.#c.createdTimestamp);
    }

    get lastMessage() {
        if (!this.#c.lastMessage) return null;
        const Message = require('./Message');
        return new Message(this.client, this.#c.lastMessage);
    }

    get lastPin() {
        if (!this.#c.lastPin) return null;
        return new Timestamp(this.#c.lastPinAt, this.#c.lastPinTimestamp);
    }

    get messages() {
        const MessageManager = require('../managers/MessageManager');
        return new MessageManager(this.#c.messages);
    }

    get type() {
        const ChannelTypeManager = require('../managers/ChannelTypeManager');
        return new ChannelTypeManager(this.#c);
    }

    channelOf(idOrMessageOrGuild) {
        if (idOrMessageOrGuild instanceof ExtendedStructure && idOrMessageOrGuild.channel) return this.is(idOrMessageOrGuild.channel);
        return guilds(this.client).resolve(idOrMessageOrGuild)?.channels.has(this.#c.id) ?? !!this.messages.resolve(idOrMessageOrGuild);
    }

    // TODO: add button collector
    // TODO: add menu collector
    
    async delete({ timeout = 0, filter = () => true } = {}) {
        if (filter(this)) {
            await boa.wait(timeout);
            return this.#c.delete();
        }
        return null;
    }

    /**
     * 
     * @param {*} optsOrContent 
     * @param {*} opts 
     * @returns {Promise<BaseMessage<Boolean>|Promise<import('./Message')>>}
     */
    async send(optsOrContent, opts = {}) {
        const Message = require('./Message'); // Defined here to avoid circular dependency
        const MessageEmbed = require('./MessageEmbed');
        if (optsOrContent instanceof BaseMessage || optsOrContent instanceof APIMessage || optsOrContent instanceof Message) {
            for (const key in opts) optsOrContent[key] = opts[key];
            const m = await this.#c.send(optsOrContent);
            return m ? new Message(this.client, m) : null;
        }

        // TODO: add support for directly sending markup objects

        opts = {
            ...opts,
            ...asMessageOptions(optsOrContent)
        };

        if ("embed" in opts) opts.embeds = [...(opts.embeds ?? []), opts.embed];
        if (opts.embeds) opts.embeds = opts.embeds.map(e => {
            if (e instanceof MessageEmbed) {
                const attachments = e.getBufferImageAttachments();
                const content = e.content;
                opts.files = [].concat(opts.files ?? []).concat(attachments);
                opts.content ??= content;
            };
            return e;
        });

        const m = await this.#c.send(opts);
        return m ? new Message(this.client, m) : null;
    }

    [Symbol.toPrimitive](hint) {
        if (hint == "string" || hint == "default") return this.mention;
        return Number(this.guild ? this.#c.id : this.#c.recipient?.id);
    }

    get [Symbol.toStringTag]() {
        return this.mention;
    }

}