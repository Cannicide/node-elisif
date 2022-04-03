const CacheManager = require('./CacheManager');
const GuildMember = require('../structures/GuildMember')

module.exports = class GuildMemberManager extends CacheManager {

    constructor(members) {
        super([...(members?.cache?.entries() ?? [])].map(
            ([id, m]) => [id, new GuildMember(members?.client, m)]
        ), GuildMember, members);
    }

    timeout(memberOrId, dateOrNumber, reason = null) {
        return this.resolve(memberOrId)?.timeout(dateOrNumber, reason);
    }

    untimeout(memberOrId, reason = null) {
        return this.resolve(memberOrId)?.untimeout(reason);
    }

}