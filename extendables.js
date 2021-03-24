//Contains various extensions of discord.js capabilities, including insertion of node-elisif methods and features.

const Elisif = require('./index');
const Discord = require('discord.js');

function ExtendedMessage(ExtendableMessage) {
    //Advanced Message
    return class AdvancedMessage extends ExtendableMessage {

        #setFlags;
        #userArgs;
        advanced = true;

        constructor(client, data) {

            super(client, data);

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

            this.interface = Elisif.interface;
            this.interpreter = Elisif.interpreter;
            this.evg = Elisif.evg;
            this.database = Elisif.evg.resolve;
            this.db = this.database;
            this.dbAsync = Elisif.evg.from;
            this.dbJson = Elisif.evg.cache;
            this.dbDynamic = Elisif.evg.remodel;
            this.getGlobalSetting = Elisif.settings.Global().get;

        }

        get prefix() {
            var localPrefix = Elisif.settings.Local(this.id).get("local_prefix");
            if (!localPrefix) localPrefix = Elisif.settings.Global().get("global_prefix");

            return localPrefix;
        }

        /**
         * Returns all valid flags found in this message.
         * Ex: "My name is -f Bob -rt" would return ["-f", "-rt"].
         * Valid flags must be set by setValidFlags() before searching with this property.
         */
        get flags() {
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
                    if (args.length == 0)
                    this.#userArgs = false;
                }
                });

            }

            return foundFlags;

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

        isExtended() {
            return true;
        }

        get client() {
            return Elisif.Client.getInstance();
        }

        get elisif() { return Elisif; }

    }
}

function ExtendedChannel(ExtendableChannel) {
    //Advanced Channel
    return class AdvancedChannel extends ExtendableChannel {

        advanced = true;

        constructor(guild, data) {

            super(guild, data);
            this.commands = Elisif.Command.channelCommandMap[data.name] || Elisif.Command.channelCommandMap[data.id];

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
            var embed = new Elisif.interface.Embed(this.lastMessage, options);
            return this.send(embed);
        }

        textInterface(question, callback) {
            return new Elisif.interface.Interface(this.lastMessage, question, callback);
        }

        reactionInterface(question, reactions, callback) {
            return new Elisif.interface.ReactionInterface(this.lastMessage, question, reactions, callback);
        }

        /**
         * Creates and registers a new message interpreter.
         * @param {Object} options - All registration options for the message interpreter.
         * @param {Function} options.filter - A function that accepts (message, args) for messages/dms to check whether or not the input should be responded to.
         * @param {Function} options.response - A function that accepts (message, args) for messages/dms to respond to an interpreted input that passes the filter check.
         * @param {boolean} options.DMs - Whether or not this message interpreter should be a DM interpreter.
         */
        messageInterpreter({filter, response, DMs}) {
            return new Elisif.interpreter.MessageLode({filter, response, DMs});
        }

        /**
         * Creates a Reaction Interpreter, containing various utility methods to interact with Reaction Interpreter data.
         * 
         * @param {String} type - The specific type or category of the Reaction Interpreter
         */
        reactionInterpreter(type) {
            return new Elisif.interpreter.ReactionLode(type);
        }

        paginate(options, elements, perPage) {
            let embed = new Elisif.interface.Embed(this.lastMessage, options);
            return new Elisif.interface.Paginator(message, embed, elements, perPage);
        }

        isExtended() {
            return true;
        }

        get client() {
            return Elisif.Client.getInstance();
        }

        get elisif() { return Elisif; }

    }
}

function ExtendedGuild(ExtendableGuild) {
    return class AdvancedGuild extends ExtendableGuild {

        advanced = true;

        constructor(client, data) {
            super(client, data);
        }

        get settings() {
            return Elisif.settings.Local(this.id);
        }

        get prefix() {
            var localPrefix = Elisif.settings.Local(this.id).get("local_prefix");
            if (!localPrefix) localPrefix = Elisif.settings.Global().get("global_prefix");

            return localPrefix;
        }

        setPrefix(pfix) {
            Elisif.settings.Local(this.id).set("local_prefix", pfix);
        }

        isExtended() {
            return true;
        }

        get client() {
            return Elisif.Client.getInstance();
        }

        get elisif() { return Elisif; }
    }
}


//Experimental direct extension of Discord.js structures
module.exports = class DiscordExtender {

    constructor() {

        //Extend message
        Discord.Structures.extend("Message", BasicMessage => ExtendedMessage(BasicMessage));

        //Extend channel
        Discord.Structures.extend("TextChannel", BasicChannel => ExtendedChannel(BasicChannel));

        //Extend guild
        Discord.Structures.extend("Guild", BasicGuild => ExtendedGuild(BasicGuild));

    }

    static extendMessage(message) {
        var AdvMessage = ExtendedMessage(Discord.Message);

        return new AdvMessage(message.client, message);
    }

    static extendChannel(message) {
        var AdvChannel = ExtendedChannel(Discord.TextChannel);

        return new AdvChannel(message.guild, message.channel);
    }

    static extendGuild(message) {
        var AdvGuild = ExtendedGuild(Discord.Guild);

        return new AdvGuild(message.client, message.guild);
    }

}