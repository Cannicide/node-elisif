const ExtendedStructure = require('./ExtendedStructure');
const Timestamp = require('./Timestamp');
const { extendedFunction, asReplyOptions, Emap, boa } = require('../util');
const { Interaction: BaseInteraction } = require("discord.js");

const PseudoInteractionAcknowledgedError = `
Warning: you are attempting to send a reply to an interaction that has already been acknowledged, but has not been replied to yet.
This means you may be attempting two consecutive replies incorrectly, like so:

    interaction.reply('hi');
    interaction.reply('another hi');

This warning message replaces the less descriptive error that would occur as a result of that type of faulty code.
If you need to send two consecutive replies, please use async code to ensure that the first reply sends before attempting the second reply.
From there, Elisif's built-in system will automatically convert consecutive reply() calls into the usually necessary followUp() calls.
Corrected example:

    await interaction.reply('hi');
    interaction.reply('another hi');

Or, alternatively without using async/await syntax:

    interaction.reply('hi')
    .then(() => interaction.reply('another hi'));

This will prevent both this Elisif warning message and the usual Discord.js error.
Hope this helps!
`;

module.exports = class Interaction extends ExtendedStructure {

    /** @type {BaseInteraction} */
    #i;
    #cachedReplies = new Emap([]);
    #acknowledged = false;
    constructor(client, interaction) {
        super(client, interaction);
        this.#i = interaction;
    }

    /**
     * @returns {import('./TextChannel')|import('./TextBasedChannel')}
     */
    get channel() {
        if (!this.#i.channel) return null;
        const ChannelManager = require('../managers/ChannelManager');
        return ChannelManager.resolveFrom(this.client, this.#i.channel);
    }

    get guild() {
        if (!this.#i.guild) return null;
        const Guild = require('./Guild');
        return new Guild(this.client, this.#i.guild);
    }

    get user() {
        const User = require('./User');
        return new User(this.client, this.#i.user);
    }

    get member() {
        if (!this.#i.member) return null;
        const GuildMember = require('./GuildMember');
        return new GuildMember(this.client, this.#i.member);
    }

    get created() {
        return new Timestamp(this.#i.createdAt, this.#i.createdTimestamp);
    }

    get reply() {
        const i = this.#i;
        return extendedFunction(async (optsOrContent, ephemeral = false) => {
            let r;
            const opts = asReplyOptions(optsOrContent, ephemeral);

            if (this.#acknowledged && !i.replied) return console.warn(PseudoInteractionAcknowledgedError);
            // TODO: replace with InteractionAcknowledgedError ^^
            this.#acknowledged = true;

            if (i.replied && this.#cachedReplies.size) r = await i.followUp(opts);
            else if (i.deferred) r = await i.editReply(opts);
            else r = await i.reply(opts);

            if (r) this.#cachedReplies.set(r.id, r);
            return r;
        }, {
            defer: (ephemeral) => {
                return i.deferReply(asReplyOptions(null, ephemeral));
            },
            async delayed(optsOrContent, ms, ephemeral) {
                if (!i.deferred) await this.defer(ephemeral);
                await boa.wait(ms);
                return this.edit(optsOrContent, ephemeral);
            },
            edit(optsOrContent) {
                return i.editReply(asReplyOptions(optsOrContent));
            },
            delete: async ({ timeout = 0, filter = () => true } = {}) => {
                if (filter(this)) {
                    await boa.wait(timeout);
                    return i.deleteReply();
                }
                return null;
            },
            fetch: () => {
                return i.fetchReply();
            },
            cached: this.#cachedReplies
        });
    }

    static from(baseInteraction) {
        return new this(baseInteraction.client, baseInteraction);
    }

}