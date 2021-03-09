//Manipulate both global (bot-wide, coded configuration) and local (guild-dependent configuration) settings

const evg = require("./evg").resolve("settings");

class LocalSettings {

    #id;
    #table;

    /**
     * Local, guild-dependent settings
     * @param {String} locale - Location at which to save local settings. Usually a guild ID.
     */
    constructor(locale) {

        this.#id = locale;
        this.#table = evg.table(locale);

    }

    get(setting) {
        return this.#table.get(setting);
    }

    getLocale() {
        return this.#id;
    }

    set(setting, value) {
        this.#table.set(setting, value);
    }

    isLocal() {
        return true;
    }

    isGlobal() {
        return false;
    }

}

class GlobalSettings extends LocalSettings {

    /**
     * Global, bot-wide settings
     */
    constructor() {
        super("global");
    }

    isLocal() {
        return false;
    }

    isGlobal() {
        return true;
    }

}

class DefaultGlobalSettings extends GlobalSettings {

    #presence_cycler = true;

    /**
     * The default Global settings for the bot
     */
    constructor() {
        super();
    }

    setGlobalDefaults() {
        this.set("presence_cycler", this.#presence_cycler);
    }

}

class DefaultLocalSettings extends LocalSettings {

    #channelfx = [];
    #nickname = false;

    /**
     * The default Local settings for any given guild.
     * @param {String} locale - Location at which to save local settings. Usually a guild ID.
     */
    constructor(locale) {
        super(locale);
    }

    setLocalDefaults() {
        this.set("channelfx", this.#channelfx);
        this.set("nickname", this.#nickname);
    }

}

module.exports = {
    Global: GlobalSettings,
    Local: LocalSettings,
    default: {
        Local: DefaultLocalSettings,
        Global: DefaultGlobalSettings
    }
}