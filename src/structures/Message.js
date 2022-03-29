// TODO: Complete Message

const ExtendedStructure = require('./ExtendedStructure');
const User = require('./User');
const GuildMember = require('./GuildMember');
const Timestamp = require('./Timestamp');
const Guild = require('./Guild');
const { Emap, asMessageOptions } = require('../util');
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

    get channel() {
        // TODO: implement custom channel
        return this.#m.channel;
    }

    get guild() {
        return new Guild(this.client, this.#m.guild);
    }

    get author() {
        return new User(this.client, this.#m.author);
    }

    get member() {
        return new GuildMember(this.client, this.#m.member);
    }

    get command() {
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

    delete({ timeout, filter }) {
        // TODO: implement custom delete method
        return this.#m.delete();
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