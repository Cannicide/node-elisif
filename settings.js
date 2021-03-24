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

        if (isNaN(locale) && locale != "global") throw new Error("Invalid locale passed to LocalSettings constructor.");

        this.#id = locale;
        this.#table = evg.table(locale);

    }

    get(setting) {
        return this.#table.get(setting);
    }

    exists() {
        return evg.has(this.getLocale()) && evg.get(this.getLocale()) != null && Object.keys(evg.get(this.getLocale())).length > 0;
    }

    getLocale() {
        return this.#id;
    }

    set(setting, value) {
        this.#table.set(setting, value);
    }

    setLocalDefaults() {
        this.set("channelfx", []);
        this.set("nickname", false);
        this.set("settings_default", true);
        this.set("local_prefix", false);
    }

    isLocal() {
        return true;
    }

    isGlobal() {
        return false;
    }

    isDefault() {
        return this.get("settings_default");
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

    setGlobalDefaults() {
        this.set("presence_cycler", true);
        this.set("debug_mode", false);
        this.set("settings_default", true);
        this.set("global_prefix", "/");
    }

    setLocalDefaults() {
        this.setGlobalDefaults();
        console.warn("Warning: setLocalDefaults() was called on GlobalSettings object. Defaulted to setGlobalDefaults().");
    }

}

class Settings {

    static Global() { 
        var settings = new GlobalSettings();

        if (!settings.exists()) settings.setGlobalDefaults();

        return settings;

    }
    
    static Local(locale) {
        var settings = new LocalSettings(locale);

        if (!settings.exists()) settings.setLocalDefaults();

        return settings;

    }
}

module.exports = Settings;