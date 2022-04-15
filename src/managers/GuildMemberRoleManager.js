const CacheManager = require('./CacheManager');
const { Role, GuildMemberRoleManager: BaseGuildMemberRoleManager, GuildMember } = require('discord.js');

module.exports = class GuildMemberRoleManager extends CacheManager {

    /** @type {BaseGuildMemberRoleManager} */
    #r;
    constructor(roleManager) {
        super([...(roleManager?.cache?.entries() ?? [])], Role, roleManager);
        this.#r = roleManager;

        this.emapSet = super.set;
        this.emapHas = super.has;
        this.set = this.#r.set.bind(this.#r);
    }

    /**
     * Determines if the entity has all of the specified roles.
     * @param  {...String} roles - A list of role names or IDs.
     * @returns {Boolean}
     */
    has(...roles) {
        return roles?.flat().every(r => this.get({ name: r }) || this.emapHas(r));
    }

    /**
     * Determines if the entity has at least one of the specified roles.
     * @param  {...String} roles 
     * @returns {Boolean}
     */
    any(...roles) {
        return roles?.flat().some(r => this.get({ name: r }));
    }

    /**
     * Determines if the entity has none of the specified roles.
     * @param  {...String} roles
     * @returns {Boolean}
     */
    none(...roles) {
        return !this.any(...roles);
    }

    /** Sets the roles applied to the member.
     * @type {(roles:import('discord.js').Collection<import('discord.js').Snowflake,Role>|Array<import('discord.js').RoleResolvable>, reason?:string) => Promise<GuildMember>} */
    set;

}