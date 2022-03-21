// TODO: Complete Message

const ExtendedStructure = require('./ExtendedStructure');
const User = require('./User');
const Timestamp = require('./Timestamp');
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

    // buttons = "new ButtonManager()";

    // menus = "new MenuManager()";

    // components = "new ComponentManager()";

    // embeds = "new EmbedManager()";

    get channel() {
        // "new Channel(this.client, this.#m.channel)";
        return this.#m.channel;
    }

    get guild() {
        // "new Guild(this.client, this.#m.guild)";
        return this.#m.guild;
    }

    get author() {
        return new User(this.client, this.#m.author);
    }

    get command() {
        return {
            name: this.words[0],
            args: this.words.slice(1)
        };
    }

    //get markup() {}

    // reactions = "new ReactionManager()";

    get timestamp() {
        return new Timestamp(this.#m.createdAt, this.#m.createdTimestamp);
    }

    delete({ timeout, filter }) {
        //not implemented yet
        return this.#m.delete();
    }

    reply(optsOrContent) {
        //not implemented yet
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