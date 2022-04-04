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

    get threads() {
        const ChannelManager = require('../managers/ChannelManager');
        return new ChannelManager(this.#t.threads);
    }

    inSlowmode() {
        return this.#t.rateLimitPerUser > 0;
    }

}

GuildChannelInterface.applyToClass(TextChannel);
module.exports = TextChannel;