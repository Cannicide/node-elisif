const TextBasedChannel = require('./TextBasedChannel');

module.exports = class TextChannel extends TextBasedChannel {

    #t;
    constructor(client, channel) {
        super(client, channel);
        this.#t = channel;
    }

    get guild() {
        if (!this.#t.guild) return null;
        const Guild = require('./Guild'); // Defined here to prevent circular dependency
        return new Guild(this.client, this.#t.guild);
    }

    get members() {
        const GuildMemberManager = require('../managers/GuildMemberManager');
        return new GuildMemberManager(this.#t.members);
    }

    // TODO: add parent prop

    // TODO: add threads manager

    inSlowmode() {
        return this.#t.rateLimitPerUser > 0;
    }

}