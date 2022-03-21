const ExtendedStructure = require('./ExtendedStructure');
const Timestamp = require('./Timestamp');
const { User: BaseUser } = require("discord.js");
const getId = (userOrId) => ["string", "number"].includes(typeof userOrId) ? userOrId : userOrId.id;

/**
 * @extends {ExtendedStructure}
 * @extends {BaseUser}
 */
module.exports = class User extends ExtendedStructure {

    /** @type {BaseUser} */
    #u;
    constructor(client, user) {
        super(client, user);
        this.#u = user;
    }

    get profile() {
        return {
            banner: this.#u.bannerURL({ dynamic: true }),
            bannerStatic: this.#u.bannerURL({ dynamic: false }),
            bannerColor: this.#u.hexAccentColor,
            avatar: this.#u.displayAvatarURL({ dynamic: true }),
            avatarStatic: this.#u.displayAvatarURL({ dynamic: false }),
            avatarDefault: this.#u.defaultAvatarURL
        }
    }

    get mention() {
        return `<@${this.#u.id}>`;
    }

    get timestamp() {
        return new Timestamp(this.#u.createdAt, this.#u.createdTimestamp);
    }

    // settings = "new UserSettings()";

    is(otherUser) {
        return this.#u.id === getId(otherUser);
    }

    authorOf(messageOrInteraction) {
        return this.is(messageOrInteraction.author ?? messageOrInteraction.user);
    }

    //memberOf(guild)

    [Symbol.toPrimitive](hint) {
        if (hint == "string") return this.mention;
        return Number(this.#u.id);
    }

    get [Symbol.toStringTag]() {
        return this.mention;
    }

}