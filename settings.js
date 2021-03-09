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

    exists() {
        return evg.has(this.getLocale()) && evg.get(this.getLocale()) != null;
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

    setGlobalDefaults() {
        this.set("presence_cycler", true);
        this.set("debug_mode", false)
    }

    setLocalDefaults() {
        this.setGlobalDefaults();
        console.warn("Warning: setLocalDefaults() was called on Global Settings object.");
    }

}

class Settings {

    static Global() { 
        return new GlobalSettings();
    }
    
    static Local(locale) {
        return new LocalSettings(locale);
    }
}

module.exports = Settings;