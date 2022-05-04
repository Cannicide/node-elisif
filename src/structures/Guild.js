const ExtendedStructure = require('./ExtendedStructure');
const CacheManager = require('../managers/CacheManager');
const Timestamp = require('./Timestamp');
const {
    Guild: BaseGuild,
    Role: BaseRole, 
    VoiceState: BaseVoiceState,
    GuildBan: BaseGuildBan,
    Invite: BaseGuildInvite,
    Presence: BasePresence,
    GuildScheduledEvent: BaseGuildEvent,
    Sticker: BaseSticker,
    StageInstance: BaseStageInstance
} = require("discord.js");

module.exports = class Guild extends ExtendedStructure {

    /** @type {BaseGuild} */
    #g;
    constructor(client, guild) {
        super(client, guild);
        this.#g = guild;
    }

    // TODO: settings manager

    get me() {
        const GuildMember = require('../structures/GuildMember');
        return new GuildMember(this.client, this.#g.me);
    }

    get members() {
        const GuildMemberManager = require('../managers/GuildMemberManager');
        return new GuildMemberManager(this.#g.members);
    }

    get channels() {
        const ChannelManager = require('../managers/ChannelManager');
        return new ChannelManager(this.#g.channels);
    }

    // TODO: custom commands prop

    get roles() {
        return new CacheManager([...this.#g.roles.cache.entries()], BaseRole, this.#g.roles, {
            guild: this
        });
    }
    
    get voiceStates() {
        return new CacheManager([...this.#g.voiceStates.cache.entries()], BaseVoiceState, this.#g.voiceStates, {
            guild: this
        });
    }

    get stageInstances() {
        return new CacheManager([...this.#g.stageInstances.cache.entries()], BaseStageInstance, this.#g.stageInstances, {
            guild: this
        });
    }

    get bans() {
        return new CacheManager([...this.#g.bans.cache.entries()], BaseGuildBan, this.#g.bans, {
            guild: this
        });
    }

    get invites() {
        return new CacheManager([...this.#g.invites.cache.entries()], BaseGuildInvite, this.#g.invites, {
            guild: this
        });
    }

    get presences() {
        return new CacheManager([...this.#g.presences.cache.entries()], BasePresence, this.#g.presences, {
            guild: this
        });
    }

    get scheduledEvents() {
        return new CacheManager([...this.#g.scheduledEvents.cache.entries()], BaseGuildEvent, this.#g.scheduledEvents, {
            guild: this
        });
    }

    get stickers() {
        return new CacheManager([...this.#g.stickers.cache.entries()], BaseSticker, this.#g.stickers, {
            guild: this
        });
    }

    get created() {
        return new Timestamp(this.#g.createdAt, this.#g.createdTimestamp);
    }

    // TODO: custom rules prop

    // TODO: on prop/method for events

}