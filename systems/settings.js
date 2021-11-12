// Elisif Settings v2.0
// Simple bot/guild Settings manager powered by EvG 4.0 storage

// By Cannicide

// Manipulate both global (bot-wide, coded configuration) and local (guild-dependent configuration) Settings.
// Pre-defined default Settings applicable to the bot or to all guilds.
// Easily set and get Setting values, including default settings.

const evg = require("./evg").dynamic("settings");

class LocalSettings {

    #id;
    #table;
    #client;

    /**
     * Local, guild-dependent settings
     * @param {ExtendedClient} client - The extended client that these settings belong to.
     * @param {String} locale - Location at which to save local settings. Usually a guild ID.
     */
    constructor(client, locale) {

        if (isNaN(locale) && locale != "global") throw new Error("Invalid locale passed to LocalSettings constructor.");

        this.#id = locale;
        this.#table = evg.table(client.name).table(locale);
        this.#client = client;

    }

    get(setting, def) {
        if (def !== undefined && !this.#table.has(setting)) {
            this.#table.set(setting, def);
        }

        return this.#table.get(setting);
    }

    table(key, def) {

        if (!this.#table.has(key)) this.#table.set(key, def !== undefined ? def : {});

        return this.#table.table(key);
    }

    exists() {
        return evg.table(this.#client.name).has(this.getLocale()) && evg.table(this.#client.name).get(this.getLocale()) != null && Object.keys(evg.table(this.#client.name).get(this.getLocale())).length > 0;
    }

    getLocale() {
        return this.#id;
    }

    set(setting, value) {
        if (this.get(setting) == value) return;
        this.#table.set(setting, value);
        if (setting != "settings_default" && this.get("settings_default")) this.set("settings_default", false);
    }

    setLocalDefaults() {
        this.set("channelfx", []);
        this.set("nickname", false);
        this.set("local_prefix", false);
        this.set("settings_default", true);
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
     * @param {ExtendedClient} client - The extended client that these settings belong to.
     */
    constructor(client) {
        super(client, "global");
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
        this.set("global_prefix", "/");
        this.set("refresh_cache_on_boot", false);
        this.set("settings_default", true);
    }

    setLocalDefaults() {
        this.setGlobalDefaults();
        console.warn("Warning: setLocalDefaults() was called on GlobalSettings object. Defaulted to setGlobalDefaults().");
    }

}

class Settings {

    /**
     * @param {ExtendedClient} client - The extended client that these settings belong to.
     */
    constructor(client) {
        this.client = client;
    }

    /**
     * Get global settings for this client.
     */
    Global() { 
        var settings = new GlobalSettings(this.client);

        if (!settings.exists()) settings.setGlobalDefaults();

        return settings;
    }
    
    /**
     * Get local settings for a locale.
     * @param {String} locale - Locale at which to save local settings, usually a guild ID.
     */
    Local(locale) {
        var settings = new LocalSettings(this.client, locale);

        if (!settings.exists()) settings.setLocalDefaults();

        return settings;
    }
}

module.exports = Settings;