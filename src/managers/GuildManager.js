const CacheManager = require('./CacheManager');
const Guild = require('../structures/Guild');

module.exports = class GuildManager extends CacheManager {

    #g;
    constructor(guilds) {
        super([...(guilds?.cache?.entries() ?? [])].map(
            ([id, g]) => [id, new Guild(guilds?.client, g)]
        ), Guild, guilds);
        this.#g = guilds;
    }

    // TODO: complete guild manager

}