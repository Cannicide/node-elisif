//@ts-check

class GuildMemberUtility {

    static map = new Map();

    /**
     * @param {import("./Utility")} util
    */
    constructor(member, util) {

        if (GuildMemberUtility.map.has(member.id)) return GuildMemberUtility.map.get(member.id);

        this.member = member;
        this.util = util;
    }

    hasPerms(...perms) {
        const enums = this.util.permsToEnums(perms);
        return this.member.permissions.has(enums);
    }

}

module.exports = GuildMemberUtility;