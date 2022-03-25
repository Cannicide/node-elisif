const ExtendedStructure = require('./ExtendedStructure');
const Timestamp = require('./Timestamp');
const User = require('./User');
const PermissionManager = require('../managers/PermissionManager');
const GuildMemberRoleManager = require('../managers/GuildMemberRoleManager');
const { GuildMember: BaseMember } = require("discord.js");
const getId = (userOrId) => ["string", "number"].includes(typeof userOrId) ? userOrId : userOrId.id;

/**
 * @extends {ExtendedStructure}
 * @extends {BaseMember}
 */
module.exports = class GuildMember extends ExtendedStructure {

    /** @type {BaseMember} */
    #m;
    constructor(client, member) {
        super(client, member);
        this.#m = member;
    }

    // TODO: add custom guild prop

    get user() {
        return new User(this.client, this.#m.user);
    }

    get roles() {
        return new GuildMemberRoleManager(this.#m.roles);
    }

    get permissions() {
        return new PermissionManager(this.#m.permissions);
    }

    /**
     * Note: due to current Discord API limitations, GuildMember#profile banner and avatar methods simply return the user's global banner/avatar.
     * The Discord API does not yet support retrieving guild members' server-specific banners/avatars.
     */
    get profile() {
        const m = this.#m;
        const u = this.user;
        return {
            async hasBanner() {
                return u.profile.hasBanner();
            },
            async banner() {
                return u.profile.banner();
            },
            async bannerStatic() {
                return u.profile.bannerStatic();
            },
            async bannerColor() {
                return u.profile.bannerColor();
            },
            hasAvatar() {
                return this.avatar() != this.avatarDefault();
            },
            avatar() {
                return m.displayAvatarURL({ dynamic: true });
            },
            avatarStatic() {
                return m.displayAvatarURL({ dynamic: false });
            },
            avatarDefault() {
                return u.profile.avatarDefault();
            },
            nickname() {
                return m.nickname;
            }
        }
    }

    get joined() {
        return new Timestamp(this.#m.joinedAt, this.#m.joinedTimestamp);
    }

    get premium() {
        if (!this.#m.premiumSince) return null;
        return new Timestamp(this.#m.premiumSince, this.#m.premiumSinceTimestamp);
    }

    get mention() {
        return `<@${this.#m.id}>`;
    }

    is(otherMember) {
        return this.#m.id === getId(otherMember);
    }

    /**
     * A more encompassing method of timing out a guild member.
     * Can be used with a number of milliseconds to timeout for, or a DateResolvable to timeout until a certain datetime.
     * Specify a Number to timeout for an amount of milliseconds. Specify a BigInt (safe integer) to timeout for an amount of minutes.
     * @param {Date|String|Number|BigInt} dateOrNumber - The date to timeout until, or the number of milliseconds/minutes to timeout for.
     * @param {String} [reason] - An optional reason for the timeout.
     */
    timeout(dateOrNumber, reason = null) {
        if (typeof dateOrNumber === 'bigint') return this.#m.timeout(Number(dateOrNumber) * 60 * 1000, reason);
        if (Number.isFinite(dateOrNumber)) return this.#m.timeout(dateOrNumber, reason);
        return this.#m.disableCommunicationUntil(dateOrNumber, reason);
    }

    /**
     * Ends a guild member's timeout.
     * @param {String} [reason] - An optional reason for ending the timeout.
     */
    untimeout(reason = null) {
        return this.#m.timeout(null, reason);
    }

    // TODO: add member settings manager

    [Symbol.toPrimitive](hint) {
        if (hint == "string") return this.mention;
        return Number(this.#m.id);
    }

    get [Symbol.toStringTag]() {
        return this.mention;
    }
    
}