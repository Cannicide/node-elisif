// TODO: COMPLETE CLIENT

const { Client } = require('discord.js');
const server = require('express')();
const { Emap, ReadonlyEdist, boa, wait } = require('../util');
const componentUtility = require('../util/components');
const { syntax } = require('../features');
const ElisifConfig = require('./config/Config');
const EventExtensionManager = require('../managers/EventExtensionManager');
const ClientUser = require('../structures/ClientUser');

class ElisifClient extends Client {

    clones = new Emap();
    cloneParent = null;
    extensions = new EventExtensionManager();
    static listener = null;
    static express = server;
    #config;
    #customEmitter = new (require("events"))();
    #simEmitter = new (require("events"))();

    /**
     * 
     * @param {ElisifConfig|(config:ElisifConfig) => ElisifConfig} config 
     */
    constructor(config) {
        super((config = ElisifConfig.from(config))?.toDiscordOptions());
        this.#config = config?.data;
        this.simulated = this.#config?.debug?.simulation;
        this.debugging = this.#config?.debug?.logs;
        this.constants = new ReadonlyEdist();

        //Setup HTTP listener
        ElisifClient.listener = ElisifClient.listener ?? server.listen(this.#config.port, () => {
            this.debug(`\n\n\t${this.#config.name} listening on port ${ElisifClient.listener.address().port} ${this.#config.commands.mode ? "(" + this.#config.commands.mode[0].toUpperCase() + this.#config.commands.mode.substring(1) + ")" : ""}`);
        });

        //Enable @error custom event if in debug mode
        if (this.#config?.debug?.uncaughtErrors) process.on('uncaughtException', async (err) => {
            this.emit("@error", err);
            await wait(2000);
            throw new Error(err);
        });

        //Setup extended structures and Elisif extended events
        this.loadFiles(__dirname + "/events", (file, name) => {
            if (name.startsWith("ws.")) this.ws.on(name.split("ws.")[1], file.bind(null, this)); 
            else this.extend(name, file);
        });

        //Autoinitialization functionality:
        this.on("ready", () => {

            syntax.initialize(this, this.#config.commands);
            componentUtility.initialize(this);
            this.debug(`\t${this.#config.name} is up and running (as of ${this.readyAt.toLocaleString()})\n\n`);

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
     * @param {String} eventName - The event to register the listener for.
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
     * Registers a raw event listener for the given event name, without any event extensions or custom event prefixes.
     * This method directly calls the default Discord.js on() method, without using any Elisif features or systems.
     * @param {String} eventName - The event to register the listener for.
     * @param {Function} listener - The listener function to handle the specified event.
     * @returns {this} ElisifClient
     */
    onRaw(eventName, listener) {
        return super.on("raw" + eventName, listener);
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

        //Support raw event listeners without event extensions:
        super.emit("raw" + eventName, ...args);

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
     * JS files that default export a function named "init" will be automatically called with the ElisifClient instance as the first argument.
     * Now supports both ESM and CJS module-type javascript files.
     * @param {String} dir - The directory to recursively load files from.
     * @param {(cmd:NodeRequire,name:String)} [forEach] - If specified, will be called on each file with the file's exports and the file's name.
     */
    async loadFiles(dir, forEach = () => null) {

        let files = require("fs").readdirSync(dir);

        files.map(async file => {
            let path = dir.replace("C:", "").replace(/\\/g, "/") + "/" + file;
            if (require("fs").lstatSync(path).isDirectory()) {
                return this.loadFiles(path);
            } else if (path.endsWith(".js") || path.endsWith(".cjs") || path.endsWith(".mjs")) {
                let cmd = await this.loadFile(path);
                forEach(cmd, file.split(".").slice(0, -1).join("."));
                return cmd;
            }
        });

    }

    /**
     * Loads a single file from the specified path.
     * JS files that default export a function named "init" will be automatically called with the ElisifClient instance as the first argument.
     * This method supports any filetype supported by the built-in node `import()` method.
     * @param {String} dir - The directory of the file to load.
     * @returns {Promise<NodeRequire>} The file's exports.
     */
    async loadFile(path) {
        path = path.replace("C:", "").replace(/\\/g, "/");
        this.debug("Loaded File:", path.split("/").slice(-1)[0]);

        let cmd = await import(path);
        cmd = cmd?.default ?? cmd;

        if (cmd && "init" in cmd) cmd.init(this);
        else if (typeof cmd === "function" && cmd?.name?.toLowerCase() === "init") cmd(this);

        return cmd;
    }

    extend(eventName, callback) {
        //Support for extending ElisifClient with custom event listeners
        return this.extensions.add(eventName, callback);
    }

    login(token) {
        if (!this.simulated) {
            //Set client token
            this.token = token;

            //Login with client
            return super.login(token);
        }
        else setTimeout(() => this.emit("ready"), 2000);
    }

    debug(...args) {
        if (this.debugging) {
            args = args.map(arg => {
                if (arg && boa().isObject(arg)) {
                    arg = Object.assign(Array.isArray(arg) ? [] : {}, arg);
                    if (Array.isArray(arg)) arg = arg.map(a => boa().stringify(a, 75) ?? a);
                    else Object.keys(arg).forEach(key => arg[key] = boa().stringify(arg[key], 75) ?? arg[key]);
                    return `\n${boa().table(arg)}\n`;
                }
                return arg;
            });

            console.log(...args);
        }
    }

    async delayedDebug(delayTime, ...args) {
        await wait(delayTime);
        this.debug(...args);
    }

    /**
     * @type {ClientUser}
     */
    user; // Here for documentation purposes

    // TODO: add primary database to client
    // TODO: add ion events to client

}

module.exports = ElisifClient;