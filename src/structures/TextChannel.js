const TextBasedChannel = require('./TextBasedChannel');
const GuildChannelInterface = require('./GuildChannelInterface');

class TextChannel extends TextBasedChannel {

    #t;
    constructor(client, channel) {
        super(client, channel);
        this.#t = channel;
    }

    get members() {
        const GuildMemberManager = require('../managers/GuildMemberManager');
        return new GuildMemberManager(this.#t.members);
    }

    // TODO: add threads manager

    inSlowmode() {
        return this.#t.rateLimitPerUser > 0;
    }

}

GuildChannelInterface.applyToClass(TextChannel);
module.exports = TextChannel;