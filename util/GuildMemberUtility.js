//@ts-check

const StructureUtility = require("./StructureUtility");

class GuildMemberUtility extends StructureUtility {

    /**
     * @param {import("./Utility")} util
    */
    constructor(member, util) {

        super(member, util);
        this.member = member;

        //Add this utility object to the map, mapped with the message ID
        this.set();

    }

    hasPerms(...perms) {
        const enums = this.util.permsToEnums(perms);
        return this.member.permissions.has(enums);
    }

}

module.exports = GuildMemberUtility;