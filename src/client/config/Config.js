const { parseBuilder } = require("../../util");
const defaults = require("./defaults");
const IntentManager = require("../../managers/IntentManager");
const Intent = require("../../structures/Intent");

module.exports = class ElisifConfig {

    /**
     * The data associated with this config.
     * Mostly used for internal purposes.
     * @private
     */
    data = Object.assign({}, defaults);

    constructor(data) {
        if (data) this.data = data;
    }

    /**
     * Sets the name of your bot.
     * @param {String} name 
     * @returns {this} ElisifConfig
     */
    name(name = this.data.name) {
        this.data.name = name;
        return this;
    }

    /**
     * Sets the intents of your bot. An intent, an array of intents, or a builder function can be provided.
     * Can be called multiple times, if necessary.
     * 
     * @param {String|Number|String[]|Number[]|(intents:IntentManager) => IntentManager} arrayOrBuilder - The intents to set. Intents can be in String, Number, builder function, or Intent object form (all of the above are internally converted into the proper discord.js FLAG types).
     * @returns {this} ElisifConfig
     * 
     * @example
     * // Several possible ways to add intents: \\
     * config.intents("GUILD_MEMBERS"); // Single
     * config.intents(["GUILD_MEMBERS", "GUILD_MESSAGES"]); // Multiple
     * config.intents(intents => intents.add("GUILD_MESSAGES")); // Builder, Single
     * config.intents(intents => {
     *   intents.add("GUILD_MEMBERS")
     *   .add("GUILD_MESSAGES");
     * }); // Builder, Multiple
     * config.intents(new IntentManager().add("GUILD_MESSAGES")); // IntentManager, Single
     * config.intents(new Intent("GUILD_MEMBERS")); // Intent object, Single
     * config.intents(Intent.valueOf("GUILD_MEMBERS")); // Number, Single
     */
    intents(arrayOrBuilder = defaults.intents) {
        arrayOrBuilder = parseBuilder(arrayOrBuilder, IntentManager);
        const intents = [].concat(arrayOrBuilder).map(intent => Intent.valueOf(intent));

        this.data.intents = this.data.intents.concat(intents);
        return this;
    }

    /**
     * Sets the presence activities of your bot. If multiple activities are provided, they will be cycled through in order and for the specified duration.
     * Can be called multiple times, if necessary.
     * @param {String|String[]} presenceOrArray - The activity or activities to set, in String form.
     * @param {Number} [duration] - The duration of each presence activity before cycling to the next, in minutes. Defaults to 10 minutes.
     * @param {String} [url] - The url of the presence activity. Defaults to Cannicide's inactive twitch URL.
     * @param {String} [type] - The type of presence activity. Defaults to "STREAMING".
     * @returns {this} ElisifConfig
     */
    presences(presenceOrArray = this.data.presences.DEFAULT_CYCLE, duration = this.data.presences.DEFAULT_DURATION, url = this.data.presences.DEFAULT_URL, type = this.data.presences.DEFAULT_TYPE) {
        this.data.presences.cycles = this.data.presences.cycles.concat([].concat(presenceOrArray).map(presence => ({
            presence,
            type,
            url,
            duration
        })));
        return this;
    }

    /**
     * Sets the port to run your bot's webserver on.
     * @param {Number} port - The port to run your bot's webserver on. Defaults to 3000.
     * @returns {this} ElisifConfig
     */
    port(port = this.data.port) {
        this.data.port = port;
        return this;
    }

    /**
     * Adds an author of your bot to the config. Can be called multiple times to add multiple authors.
     * @param {String} username - The username of the author to add.
     * @param {String} [id] - The optional user ID of the author to add. Can be used internally to, for example, set access to the eval command.
     * @returns {this} ElisifConfig
     */
    author(username, id) {
        this.data.authors.push({username, id});
        return this;
    }

    /**
     * Set a description for your bot. Can be used internally for a few purposes.
     * @param {String} description - The description to set.
     * @returns {this} ElisifConfig
     */
    description(description = this.data.description) {
        this.data.description = description;
        return this;
    }

    /**
     * Enables the specified Node-Elisif expansion. Can be called multiple times to enable multiple expansions.
     * Expansions allow you to effortlessly add pre-made commands and features to your bot.
     * @param {String} name - The name of the expansion to enable.
     * @param {Object} [options] - The optional options/settings for the expansion.
     * @returns {this} ElisifConfig
     */
    expansion(name, options = {}) {
        this.data.expansions.push({name, options});
    }

    /**
     * Sets a node-elisif-specific or discord.js-specific Client option.
     * Most Node-Elisif options have unique methods in the ElisifConfig, but this method can be used to configure those that don't (as well as djs options not covered by ElisifConfig).
     * @param {String} customOption - The name of the option to set.
     * @param {String} value - The value to set for the option.
     * @returns {this} ElisifConfig
     */
    custom(customOption = "UNKNOWN", value = "UNKNOWN") {
        
        this.data[customOption] = value;
        return this;

    }

    /**
     * Sets the path to storage to use for Elisif settings. This includes persistent Client and Guild settings, as well as a few feature settings.
     * The storage path, by default, is a SIFDB file managed internally by Elisif that will be used unless a valid database/filepath is specified by this method.
     * @param {String} path - The path to use for storage. Supports any database scheme or type supported by Sifbase, including database URLs and paths to JSON/SIFDB files.
     * @returns {this} ElisifConfig
     */
    database(path = this.data.database) {
        this.data.database = path;
        return this;
    }

    /**
     * Enables debug mode. This will enable certain additional Node-Elisif logging, which were made to easily debug issues in this package.
     * Running this method enables debug mode. The 'catchErrors' option does not need to be true in order to enable debug mode.
     * You can also create logs that are only sent when debug mode is enabled, using `client.debug(...messages)`. This makes it easy to quickly switch between debugging and production-ready code.
     * @param {Boolean} [catchErrors] - Whether or not to catch and log uncaught errors. Defaults to false. If true, uncaught errors will be logged to the console and will trigger the '@error' custom event before ending the process (allowing you to create custom error handling/messages).
     * @returns {this} ElisifConfig
     */
    debug(catchErrors = this.data.debug.uncaughtErrors) {
        this.data.debug.logs = true;
        this.data.debug.uncaughtErrors = catchErrors;

        return this;
    }

    /**
     * Sets the deployment mode, i.e. whether the bot is in production mode or development mode.
     * This option makes it extremely easy to switch from testing commands locally to publishing them globally.
     * 
     * If in development mode, all bot commands will only be available in the specified test guilds.
     * If in production mode, all bot commands that do not have guilds explicitly set will be available globally.
     * If neither is specified or this option is not used, the mode and test guilds will be ignored.
     * @param {"production"|"development"|"prod"|"dev"} mode - Whether in production or development mode.
     * @param {String[]} [testGuilds] - The IDs of test guilds to publish the commands to, if in development mode. 
     */
    mode(mode = this.data.commands.mode, testGuilds = this.data.commands.testGuilds) {
        const modes = {
            production: "production",
            development: "development",
            prod: "production",
            dev: "development"
        };

        this.data.commands.mode = modes[mode.toLowerCase()] ?? null;
        this.data.commands.testGuilds = testGuilds;
    }

    /**
     * Enables simulation mode. Runs a simulated version of the ElisifClient, with simulated structures and no actual HTTP requests.
     * Incredibly useful for debugging and testing, or for working on features while the Discord API is down.
     * @returns {this} ElisifConfig
     */
    simulation() {
        this.data.debug.simulation = true;
        return this;
    }

    toDiscordOptions() {
        const customs = Object.keys(this.data).filter(k => !(k in defaults)).map(key => ({key,value: this.data[key]})).reduce((acc, {key, value}) => ({...acc, [key]: value}), {});
        return {
            ...customs,
            intents: this.data.intents
        }
    }

    static from(optsOrBuilder) {
        const { parseBuilder } = require('../../util');
        optsOrBuilder = parseBuilder(optsOrBuilder, this);

        if (!(optsOrBuilder instanceof this)) return new this(optsOrBuilder);
        return optsOrBuilder;
    }

}