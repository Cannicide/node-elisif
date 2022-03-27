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
        const u = this.#u;
        return {
            async hasBanner() {
                let banner = await this.banner();
                return !banner.startsWith("https://singlecolorimage.com/get/");
            },
            async banner() {
                let banner;

                try {
                    banner = u.bannerURL({ dynamic: true });
                }
                catch {
                    await u.fetch(true);
                    try {
                        banner = u.bannerURL({ dynamic: true });
                    }
                    catch {
                        banner = null;
                    }
                }

                return banner ?? `https://singlecolorimage.com/get/${(await this.bannerColor())?.slice(1) ?? "000000"}/400x191.png`;
            },
            async bannerStatic() {
                let banner;

                try {
                    banner = u.bannerURL({ dynamic: false });
                }
                catch {
                    await u.fetch(true);
                    try {
                        banner = u.bannerURL({ dynamic: false });
                    }
                    catch {
                        banner = null;
                    }
                }

                return banner ?? `https://singlecolorimage.com/get/${(await this.bannerColor()).slice(1)}/400x191.png`;
            },
            async bannerColor() {
                if (!u.hexAccentColor) await u.fetch(true);
                return u.hexAccentColor;
            },
            hasAvatar() {
                return this.avatar() != this.avatarDefault();
            },
            avatar() {
                return u.displayAvatarURL({ dynamic: true });
            },
            avatarStatic() {
                return u.displayAvatarURL({ dynamic: false });
            },
            avatarDefault() {
                return u.defaultAvatarURL;
            }
        }
    }

    get mention() {
        return `<@${this.#u.id}>`;
    }

    get created() {
        return new Timestamp(this.#u.createdAt, this.#u.createdTimestamp);
    }

    // TODO: add custom presence manager

    // TODO: add user settings manager

    authorOf(messageOrInteraction) {
        return this.is(messageOrInteraction.author ?? messageOrInteraction.user);
    }

    // TODO: add memberOf(guild) method

    isClient() {
        return false;
    }

    [Symbol.toPrimitive](hint) {
        if (hint == "string") return this.mention;
        return Number(this.#u.id);
    }

    get [Symbol.toStringTag]() {
        return this.mention;
    }

}