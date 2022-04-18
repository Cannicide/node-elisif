const CacheManager = require('./CacheManager');
const Guild = require('../structures/Guild');

module.exports = class GuildManager extends CacheManager {

    #g;
    constructor(guilds) {
        super([...(guilds?.cache?.entries() ?? [])].map(
            ([id, g]) => [id, new Guild(guilds?.client, g)]
        ), Guild, guilds);
        this.#g = guilds;
        this.#fetchAll();
    }

    async #fetchAll() {
        // Attempt to update the cache with the latest guild values:
        await this.fetch();
    }

    // TODO: complete guild manager

}