const ExtendedStructure = require('./ExtendedStructure');
const Timestamp = require('./Timestamp');
const { Emap, asMessageOptions, boa } = require('../util');
const { Message: BaseMessage } = require("discord.js");

module.exports = class Message extends ExtendedStructure {

    /** @type {BaseMessage} */
    #m;
    constructor(client, message) {
        super(client, message);
        this.#m = message;
    }

    get words() {
        return this.#m.content.trim().split(/\s+/);
    }

    // TODO: add button manager

    // TODO: add menu manager

    // TODO: add component manager

    // TODO: add embed manager

    /**
     * @returns {TextChannel}
     */
    get channel() {
        if (!this.#m.channel) return null;
        const TextChannel = require('./TextChannel');
        return new TextChannel(this.client, this.#m.channel);
    }

    get guild() {
        if (!this.#m.guild) return null;
        const Guild = require('./Guild');
        return new Guild(this.client, this.#m.guild);
    }

    get author() {
        const User = require('./User');
        return new User(this.client, this.#m.author);
    }

    get member() {
        if (!this.#m.member) return null;
        const GuildMember = require('./GuildMember');
        return new GuildMember(this.client, this.#m.member);
    }

    get textCommand() {
        return {
            name: this.words[0],
            args: this.words.slice(1)
        };
    }

    // TODO: add markup property

    // TODO: add reaction manager

    get created() {
        return new Timestamp(this.#m.createdAt, this.#m.createdTimestamp);
    }

    async delete({ timeout = 0, filter = () => true } = {}) {
        if (filter(this)) {
            await boa.wait(timeout);
            return this.#m.delete();
        }
        return null;
    }

    reply(optsOrContent) {
        // TODO: implement custom reply method
        return this.#m.reply(optsOrContent);
    }

    static from(client, optsOrContent) {
        optsOrContent = asMessageOptions(optsOrContent);
        if (optsOrContent instanceof BaseMessage) return new this(client, optsOrContent);

        const opts = {
            applicationId: client.application?.id,
            attachments: new Emap(),
            author: optsOrContent.user ?? client.user,
            channel: null,//"Channel.unknown()",
            get channelId() { return this.channel?.id; },
            components: [],
            content: "",
            createdAt: new Date(),
            get createdTimestamp() { return this.createdAt.getTime(); },
            crosspostable: true,
            deletable: true,
            editable: true,
            embeds: [],
            guild: null,//"Guild.unknown()",
            get guildId() { return this.guild?.id; },
            member: null,//"GuildMember.from(client, guild, client.user)",
            pinnable: true,
            stickers: new Emap(),
            system: false,
            type: "DEFAULT",
            ...optsOrContent
        }

        return new this(client, opts);
    }

}