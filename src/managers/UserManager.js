const CacheManager = require('./CacheManager');
const User = require('../structures/User')

module.exports = class UserManager extends CacheManager {

    constructor(users) {
        super([...(users?.cache?.entries() ?? [])].map(
            ([id, u]) => [id, new User(users?.client, u)]
        ), User, users);
    }

    bots() {
        return this.filter(u => u.bot);
    }

}