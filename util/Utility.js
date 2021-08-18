
const MessageUtility = require('./MessageUtility');
const GuildMemberUtility = require('./GuildMemberUtility');
const StructureUtility = require('./StructureUtility');
const { Intents, Permissions } = require('discord.js');

class Utility {

    /**
     * @param {string} str
     * @returns {string}
     */
    escapeString(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    getIntentsAsArray() {
        return [
            "GUILDS",
            "GUILD_BANS",
            "GUILD_VOICE_STATES",
            "GUILD_MESSAGES",
            "GUILD_MESSAGE_REACTIONS",
            "GUILD_MESSAGE_TYPING",
            "DIRECT_MESSAGES"
        ];
    }

    getPrivilegedIntentsAsArray() {
        return [
            "GUILD_MEMBERS",
            "GUILD_PRESENCES"
        ];
    }

    getAllIntentsAsArray() {
        const allIntents = this.getIntentsAsArray();
        return allIntents.concat(this.getPrivilegedIntentsAsArray());
    }

    getIntentEnums() {
        return this.intentsToEnums(this.getIntentsAsArray());
    }

    getPrivilegedIntentEnums() {
        return this.intentsToEnums(this.getPrivilegedIntentsAsArray());
    }

    getAllIntentEnums() {
        return this.intentsToEnums(this.getAllIntentsAsArray());
    }

    intentToEnum(intent) {
        return Intents.FLAGS[intent];
    }

    intentsToEnums(intents) {
        return intents.map(intent => this.intentToEnum(intent));
    }

    permToEnum(perm) {
        return Permissions.FLAGS[perm];
    }

    permsToEnums(perms) {
        return perms.map(perm => this.permToEnum(perm));
    }

    //Structure Utility Methods:

    Structure = StructureUtility;

    message(message) {
        return this.Structure.get(message.id) ?? new MessageUtility(message, this);
    }

    member(member) {
        return this.Structure.get(member.id) ?? new GuildMemberUtility(member, this);
    }

}

//Intentionally uses constructed object instead of static class, for documentation purposes
module.exports = new Utility();