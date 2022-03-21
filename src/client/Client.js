// TODO: COMPLETE CLIENT

const { Client } = require('discord.js');
const server = require('express')();
const { parseBuilder, Emap, boa } = require('../util');
const ElisifConfig = require('./config/Config');
const EventExtensionManager = require('../managers/EventExtensionManager');
const ClientUser = require('../structures/ClientUser');

class ElisifClient extends Client {

    clones = new Emap();
    cloneParent = null;
    extensions = new EventExtensionManager();
    static listener = null;
    #config;
    #customEmitter = new (require("events"))();
    #simEmitter = new (require("events"))();

    /**
     * 
     * @param {ElisifConfig|(config:ElisifConfig) => ElisifConfig} config 
     */
    constructor(config) {
        super((config = parseBuilder(config, ElisifConfig))?.toDiscordOptions());
        // SyntaxProgram.setClient(this);
        this.#config = config?.data;
        this.simulated = this.#config?.debug?.simulation;
        // this.constants = boa.dict(new Constants());

        ElisifClient.listener = ElisifClient.listener ?? server.listen(this.#config.port, () => {
            console.log(`\n\n${this.#config.name} listening on port ${ElisifClient.listener.address().port}`);
        });

        //Setup persistent, scheduled, and ION events
        // this.#events.initialize();

        //Set debug mode
        // this.setting("debug_mode", config.debug);

        //Enable @error custom event if in debug mode
        // if (config.debug && config.uncaughtErrors) process.on('uncaughtException', (err) => {
        //     this.emit("@error", err);
        //     throw new Error(err);
        // });

        //Setup extended structures and Elisif extended events
        this.loadFiles(__dirname + "/events", (file, name) => {
            this.extend(name, file);
        });

        //Autoinitialization functionality:
        this.on("ready", () => {

            // SlashCommand.setupAll(this);
            // builder.initializeAutocomplete(this);
            console.log("READY")

            //Define simulated ClientUser:
            if (this.simulated) this.user = ClientUser.from(client);

        });
    }

    /**
     * Registers a new event listener for the specified event. Extends the default discord.js event emitter.
     * Automatically replaces "message" event with "messageCreate" in order to avoid the deprecation warning.
     * Also supports the following unique event prefixes:
     * - \# >> Makes the event listener clonable. Cloned clients will inherit the listener. (ex: "#message" triggers on "message" event)
     * - @ >> Custom event listeners that do not interfere with discord.js events. (ex: "@message" will not trigger on "message" event)
     * - No prefix >> Default event listener behavior. (ex: "message" triggers on "message" event)
     * 
     * Includes built-in custom "@error" event that triggers on error if config.uncaughtErrors is enabled.
     * 
     * @param {"String"} eventName - The event to register the listener for.
     * @param {Function} listener - The listener function to handle the specified event.
     * @returns {this} ElisifClient
     */
    on(eventName, listener) {
        //Override on() to support cloning

        if (typeof eventName === 'function') [eventName, listener] = [eventName.name, eventName];

        //Support custom event listeners:
        if (eventName.startsWith("@")) {
            return this.#customEmitter.on(eventName, listener);
        }

        //Prevent deprecation errors for `message` event:
        if (eventName == "message" || eventName.slice(1) == "message") eventName += "Create";

        //Support simulated event listeners:
        if (this.simulated) {
            return this.#simEmitter.on(eventName, listener);
        }

        //Support clonable event listeners:
        if (eventName.startsWith("#")) {
            super.on(eventName, listener);
            return super.on(eventName.slice(1), super.emit.bind(this, eventName));
        }

        //Support regular event listeners:
        return super.on(eventName, listener);
    }

    /**
     * Emits an event with the specified name and args. Extends the default discord.js event emitter.
     * Supports all of the custom prefixes supported by ElisifClient#on().
     * 
     * @param {String} eventName - The event to emit.
     * @param {...*} [args] - The arguments to pass to the event listener.
     */
    emit(eventName, ...args) {
        //Override emit() to support safe custom events

        //Support custom event listeners:
        if (eventName.startsWith("@")) {
            return this.#customEmitter.emit(eventName, ...args);
        }

        //Support event extensions
        if (this.extensions.has(eventName)) for (const ext of this.extensions.get(eventName)) args = ext.callback(...args);

        if (this.simulated) {
            //Prevent errors for emitting `message` event:
            if (eventName == "message" || eventName.slice(1) == "message") eventName += "Create";
            return this.#simEmitter.emit(eventName, ...args);
        }

        //Support regular event listeners:
        return super.emit(eventName, ...args);
    }

    /**
     * Clones this ElisifClient, allowing another client to run the same commands and clonable event listeners.
     * 
     * @param {String} token - The token of the second client.
     * @param {Config} config - The configuration of the second client. Uses the config of the parent client if unspecified.
     * @returns {ElisifClient} The second (clone) client instance.
     */
    clone(token, config) {
        //Support for multiple clients running same event listeners and commands, and optionally having same config

        let clone = new ElisifClient(config?.data || Object.assign({}, this.#config));
        clone.cloneParent = this;

        this.eventNames().forEach(eventName => {
            if (!eventName.startsWith("#")) return;
            this.listeners(eventName).forEach(listener => {
                clone.on(eventName, listener);
            });
        });

        clone.login(token);
        this.clones.set(token, clone);

        return clone;

    }

    /**
     * Recursively loads all JS files within the specified directory, including within child directories.
     * @param {String} dir - The directory to recursively load files from.
     * @param {(cmd:NodeRequire,name:String)} [forEach] - If specified, will be called on each file with the file's exports and the file's name.
     */
    loadFiles(dir, forEach = () => null) {

        let files = require("fs").readdirSync(dir);

        files.map(file => {
            let path = dir + "/" + file;
            if (require("fs").lstatSync(path).isDirectory()) {
                names.push(file + "/");
                return this.loadFiles(path);
            } else if (path.endsWith(".js")) {
                this.debug("Loaded File:", file);
                let cmd = require(path);
                if ("init" in cmd) cmd.init(this);
                else if (typeof cmd === "function" && cmd?.name?.toLowerCase() === "init") cmd(this);
                forEach(cmd, file.split(".js")[0]);
                return cmd;
            }
        });

    }

    extend(eventName, callback) {
        //Support for extending ElisifClient with custom event listeners
        return this.extensions.add(eventName, callback);
    }

    login(token) {
        if (!this.simulated) return super.login(token);
        else setTimeout(() => this.emit("ready"), 2000);
    }

    debug(...args) {
        if (this.#config?.debug?.logs) {
            args = args.map(arg => {
                if (arg && boa.isObject(arg)) {
                    arg = Object.assign(Array.isArray(arg) ? [] : {}, arg);
                    if (Array.isArray(arg)) arg = arg.map(a => boa.stringify(a, 75) ?? a);
                    else Object.keys(arg).forEach(key => arg[key] = boa.stringify(arg[key], 75) ?? arg[key]);
                    return `\n${boa.table(arg)}\n`;
                }
                return arg;
            });

            console.log(...args);
        }
    }

    /**
     * @type {ClientUser}
     */
    user; // Here for documentation purposes

}

module.exports = ElisifClient;