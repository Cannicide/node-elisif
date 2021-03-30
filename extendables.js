//Contains various extensions of discord.js capabilities, including insertion of node-elisif methods and features.

const Discord = require('discord.js');

function ExtendedMessage(ExtendableMessage) {
    //Advanced Message
    class AdvancedMessage extends ExtendableMessage {

        #setFlags;
        #userArgs;
        advanced = true;
        #cooldownTimeLeft = 0;
        #cooldownLastUse = 0;
        // #data;

        constructor(client, data, channel) {

            super(client, data, channel);
            // this.#data = data;

            //Get prefix from Handler

            var pfix = this.prefix;

            //Determine args and command

            var components = data.content.split(" ");
            var commandWithPrefix = components[0].toLowerCase();
            var args = components.slice(1);

            var escapedPrefix = pfix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //Potentially might need to add another back slash to second param here
            var foundPrefix = new RegExp(escapedPrefix);

            var command = commandWithPrefix.replace(foundPrefix, "");

            if (args.length < 1) {
                var args = false;
            }

            //----------------------------------------------------------------
            //Set properties
            
            this.label = command;
            this.defaultFlags = data.flags;
            this.#userArgs = args; //(Read-only args)

            //Set accessible Elisif systems

            this.interface = require("./interface");
            this.interpreter = require("./interpreter");
            this.evg = require("./evg");
            this.database = require("./evg").resolve;
            this.db = this.database;
            this.dbAsync = require("./evg").from;
            this.dbJson = require("./evg").cache;
            this.dbDynamic = require("./evg").remodel;
            this.getGlobalSetting = require("./settings").Global().get;

        }

        get prefix() {
            var localPrefix = require("./settings").Local(this.guild.id).get("local_prefix");
            if (!localPrefix) localPrefix = require("./settings").Global().get("global_prefix");

            return localPrefix;
        }

        /**
         * Returns all valid flags found in this message.
         * Ex: "My name is -f Bob -rt" would return ["-f", "-rt"].
         * Valid flags must be set by setValidFlags() before searching with this property.
         */
        get cmdFlags() {
            //Find message flags

            var foundFlags = false;

            if (this.#userArgs && this.#setFlags) {
                //Find flags in message, remove them from args
                foundFlags = [];
                this.#userArgs.forEach((arg, index) => {
                var flag = this.findValidFlag(arg);

                if (flag) {
                    foundFlags.push(flag.name);
                    this.#userArgs.splice(index, 1);
                    if (this.#userArgs.length == 0)
                    this.#userArgs = false;
                }
                });

            }

            return foundFlags;

        }

        /**
         * Returns whether or not the specified command flag was found in the message.
         * @param {*} flag - The specified command flag
         * @returns boolean
         */
        hasFlag(flag) {
            if (!flag.match("-")) flag = "-" + flag;

            var flags = this.cmdFlags;
            return flags.includes(flag);
        }

        /**
         * Returns whether or not ALL specified command flags were found in the message.
         * @param  {...String} flags - The specified command flags
         * @returns boolean
         */
        hasFlags(...flags) {
            
            for (var flag of flags) {
                if (!this.hasFlag(flag)) return false;
            }

            return true;

        }

        /**
         * Returns the arguments of this message.
         * This is usually an array of individual words in the message, split by spaces.
         */
        get args() {
            return this.#userArgs;
        }

        /**
         * Set which valid flags to search for in a message.
         * The 'flags' property will only return flags that are set by this method AND found in the message.
         * @param {Object[]} flags - An array of valid flags that can be searched for in the message.
         * @param {String} flags[].name - The name of the flag (ex: '-f')
         * @param {String} flags[].desc - The description of the flag, accessible only through 'getValidFlags()' and 'findValidFlag()'
         */
        setValidFlags(flags) {
            this.#setFlags = flags;
        }

        /**
         * Gets all valid flags that can be searched for in the message.
         * These flags are the only flags that the 'flags' property will search for in this message.
         * @returns An array of flag objects in the form {name: "-f", desc: "Description of the flag"}
         */
        getValidFlags() {
            return this.#setFlags;
        }

        /**
         * Finds a single valid flag with a name matching the specified name.
         * Used by the 'flags' property to determine whether an argument in this message is a valid flag.
         * @param {*} name - The name of the flag (ex: '-f')
         * @returns A flag object in the form {name: "-f", desc: "Description of the flag"}
         */
        findValidFlag(name) {
            return this.getValidFlags().find(flag => flag.name.toLowerCase() == name.toLowerCase());
        }

        /**
         * Sets the time, in seconds, remaining on the cooldown
         * @param {*} cooldown - Cooldown remaining time, in seconds
         */
        setCooldownLeft(cooldown) {
            this.#cooldownTimeLeft = cooldown;
        }

        /**
         * Sets the time, in seconds, since this command was last used by the user
         * @param {*} last_use - Time since last use, in seconds
         */
        setSinceLastUse(last_use) {
            this.#cooldownLastUse = last_use;
        }

        /**
         * The remaining cooldown time for this user on the command sent in this message, in seconds.
         */
        get cooldownLeft() {
            return this.#cooldownTimeLeft;
        }

        /**
         * The time since this user last sent the same command sent in this message, in seconds.
         * If this message contains '/help', for example, this property returns how long it has been since the user last sent '/help'.
         */
        get sinceLastUse() {
            return this.#cooldownLastUse;
        }

        isExtended() {
            return true;
        }

        get client() {
            return this.elisif.Client ? this.elisif.Client.getInstance() : null;
        }

        get elisif() { return require("./index").getInstance(); }

    }

    return AdvancedMessage;
}

function ExtendedChannel(ExtendableChannel) {
    //Advanced Channel
    class AdvancedChannel extends ExtendableChannel {

        advanced = true;

        constructor(guild, data) {

            super(guild, data);

            this.commands = require("./command").channelCommandMap[data.name] || require("./command").channelCommandMap[data.id];

        }

        /**
       * Creates a new Embed, which can be used with or without the interface.
       * @param {Object} options - The Embed's options.
       * @param {String} [options.thumbnail] - The URL to the preferred thumbnail of the Embed.
       * @param {Object[]} [options.fields] - An array of the contents of the Embed, separated by field.
       * @param {String} options.fields[].name - The title of the field.
       * @param {String} options.fields[].value - The content of the field.
       * @param {Boolean} [options.fields[].inline] - Whether or not the field is inline.
       * @param {String} [options.desc] - The description of the Embed.
       * @param {String} [options.title] - The title of the Embed.
       * @param {String[]} [options.footer[]] - An array of footer messages.
       * @param {String} [options.icon] - The URL of the Embed's icon.
       * @param {String} [options.image] - The URL of the Embed's image.
       * @param {String} [options.video] - The URL of the Embed's video.
       * @param {Boolean} [options.useTimestamp] - Whether or not to include the timestamp in the Embed.
       */
        embed(options) {
            var embed = new (require("./interface").Embed)(this.lastMessage, options);
            return this.send(embed);
        }

        /**
         * Creates an interface to receive message input from users.
         * @param {*} question - The question or prompt to send to users for their input.
         * @returns Promise; (message, questionMessage) => {}
         */
        textInterface(question) {
            return new Promise((resolve, reject) => {
                new (require("./interface").Interface)(this.lastMessage, question, (m, q) => {
                    resolve({m:m,q:q,reply:this.textInterface.bind(this)});
                });
            });
        }

        /**
         * Creates an interface to receive reaction input from users.
         * @param {*} question - The question or prompt to send to users for their input.
         * @param {*} reactions - The specific reactions to look for.
         * @param {*} time - The amount of time to keep the interface open.
         * @param {*} allUsers - Whether or not to receive input from all users, or just from the message author.
         * @returns Promise; (message, reaction) => {}
         */
        reactionInterface(question, reactions, time, allUsers) {
            return new Promise((resolve, reject) => {
                new (require("./interface").ReactionInterface)(this.lastMessage, question, reactions, (m, r) => {
                    resolve({m:m,r:r,reply:this.reactionInterface.bind(this)});
                }, time, allUsers);
            });
        }

        /**
         * Creates and registers a new message interpreter.
         * @param {Object} options - All registration options for the message interpreter.
         * @param {Function} options.filter - A function that accepts (message, args) for messages/dms to check whether or not the input should be responded to.
         * @param {Function} options.response - A function that accepts (message, args) for messages/dms to respond to an interpreted input that passes the filter check.
         * @param {boolean} options.DMs - Whether or not this message interpreter should be a DM interpreter.
         */
        messageInterpreter({filter, response, DMs}) {
            return new (require("./interpreter").MessageLode)({filter, response, DMs});
        }

        /**
         * Creates a Reaction Interpreter, containing various utility methods to interact with Reaction Interpreter data.
         * 
         * @param {String} type - The specific type or category of the Reaction Interpreter
         */
        reactionInterpreter(type) {
            return new (require("./interpreter").ReactionLode)(type);
        }

        /**
         * Creates a new Pagination menu, a reaction collector that cycles through pages on user reaction
         * @param {Object} message - Discord message object
         * @param {EmbedMessage} embed - Message to send and paginate
         * @param {Object[]} elements - Array of fields to cycle through when paginating
         * @param {String} elements[].name - Field title
         * @param {String} elements[].value - Field content
         * @param {Number} perPage - Number of elements per page
         */
        paginate(options, elements, perPage) {
            let embed = new (require("./interface").Embed)(this.lastMessage, options);
            return new (require("./interface").Paginator)(this.lastMessage, embed, elements, perPage);
        }

        isExtended() {
            return true;
        }

        get client() {
            return this.elisif.Client ? this.elisif.Client.getInstance() : null;
        }

        get elisif() { return require("./index").getInstance(); }

    }

    return AdvancedChannel;
}

function ExtendedGuild(ExtendableGuild) {
    class AdvancedGuild extends ExtendableGuild {

        advanced = true;
        // #data;

        constructor(client, data) {
            super(client, data);
            // this.#data = data;
        }

        get settings() {
            return require("./settings").Local(this.id);
        }

        get prefix() {
            var localPrefix = require("./settings").Local(this.id).get("local_prefix");
            if (!localPrefix) localPrefix = require("./settings").Global().get("global_prefix");

            return localPrefix;
        }

        setPrefix(pfix) {
            require("./settings").Local(this.id).set("local_prefix", pfix);
        }

        isExtended() {
            return true;
        }

        get client() {
            return this.elisif.Client ? this.elisif.Client.getInstance() : null;
        }

        get elisif() { return require("./index").getInstance(); }
    }

    return AdvancedGuild;
}


//Experimental direct extension of Discord.js structures
module.exports = class DiscordExtender {

    constructor() {

        //Extend message
        Discord.Structures.extend("Message", BasicMessage => ExtendedMessage(BasicMessage));

        //Extend channel
        Discord.Structures.extend("TextChannel", BasicChannel => ExtendedChannel(BasicChannel));
        Discord.Structures.extend("NewsChannel", BasicChannel => ExtendedChannel(BasicChannel));

        //Extend guild
        Discord.Structures.extend("Guild", BasicGuild => ExtendedGuild(BasicGuild));

    }

    static extendMessage(message) {
        var AdvMessage = ExtendedMessage(Discord.Message);

        return new AdvMessage(message.client, message, message.channel);
    }

    static extendChannel(message) {
        var AdvChannel = ExtendedChannel(typeof message.channel);

        return new AdvChannel(message.guild, message.channel);
    }

    static extendGuild(message) {
        var AdvGuild = ExtendedGuild(Discord.Guild);

        return new AdvGuild(message.client, message.guild);
    }

    static AdvancedMessage = ExtendedMessage(Discord.Message);
    static AdvancedTextChannel = ExtendedChannel(Discord.TextChannel);
    static AdvancedGuild = ExtendedGuild(Discord.Guild);

}