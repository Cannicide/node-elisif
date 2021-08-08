// An extension of the Discord.js Message class

const { APIMessage } = require("discord.js");

// class ButtonManager
const ButtonManager = require("../managers/ButtonManager");

// class SelectMenuManager
const SelectMenuManager = require("../managers/SelectMenuManager");


function ExtendedMessage(ExtendableMessage) {
    //Advanced Message
    class AdvancedMessage extends ExtendableMessage {

        #setFlags;
        #userArgs;
        advanced = true;
        #cooldownTimeLeft = 0;
        #cooldownLastUse = 0;
        #buttonCollector;
        #menuCollector;
        #collecting = false;
        #menu_collecting = false;
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

            var escapedPrefix = pfix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var foundPrefix = new RegExp(escapedPrefix);

            var command = commandWithPrefix.replace(foundPrefix, "");

            if (args.length < 1) {
                var args = false;
            }

            //----------------------------------------------------------------
            //Set properties
            
            this.label = command;
            this.labelWithPrefix = commandWithPrefix;
            this.escapedPrefix = foundPrefix;
            this.startsWithPrefix = this.labelWithPrefix.startsWith(this.prefix);
            this.components = data.components;
            this._data = data;
            this.defaultFlags = data.flags;
            this.#userArgs = args; //(Read-only args)

            this.isCommand = () => this.label && this.client.commands.has(this.label);
            this.getCommand = () => this.isCommand() ? this.client.commands.get(this.label) : false;

            //Command-only methods
            if (this.isCommand()) {
                /**
                 * Gets the specified command argument from the message.
                 * @param {Number|String} key - The argument to retrieve. Can be a Number index (message.args[index]) or a String key (Command({args:[{name:key}]}).
                 * @returns {String|Boolean} The retrieved argument
                 */
                this.getArg = (key) => {
                    if (!this.#userArgs || this.#userArgs.length < 1 || key === undefined) return false;

                    if (isNaN(key)) var argIndex = this.getCommand().args.findIndex(arg => arg.name.toLowerCase() == key.toLowerCase());
                    else var argIndex = key;

                    if (argIndex < 0) return false;

                    return this.#userArgs[argIndex];
                }

                /**
                 * Like message#getArg(), but gets multiple command arguments from the message.
                 * If keys/indexes are not provided, all args are returned.
                 * @param {(Number|String)[]} [keys] - The arguments to retrieve. Can be an array made up of Number indexes and/or String keys.
                 * @returns {String[]} The retrieved arguments
                 */
                this.getArgs = (...keys) => keys ? keys.map(key => this.getArg(key)) : this.args;

                /**
                 * Checks whether the specified command argument has been sent in the message.
                 * If a key is not provided, checks whether any command arguments have been sent in the message.
                 * @param {Number|String} key - The argument to check. Can be a Number index (message.args[index]) or a String key (Command({args:[{name:key}]}).
                 * @param {String} [value] - Optional value to check if the command argument is equal to.
                 * @returns {Boolean} Whether the specified argument was found
                 */
                this.hasArg = (key, value) => this.getArg(key === undefined ? 0 : key) ? (key === undefined || value === undefined ? true : this.getArg(key).toLowerCase() == value.toLowerCase()) : false;

                /**
                 * Like message#hasArg(), but checks whether multiple command arguments have been sent in the message.
                 * If keys/indexes are not provided, returns whether all arguments (including optional) of the command have been sent in the message.
                 * @param {(Number|String)[]} keys - The arguments to check. Can be an array made up of Number indexes and/or String keys.
                 * @returns {Boolean} Whether all specified arguments were found
                 */
                this.hasArgs = (...keys) => keys ? keys.every(key => this.hasArg(key)) : this.getCommand().args.every(arg => this.hasArg(arg.name));
            }

            //Embed extensions

            /**
             * Fetches an embed from the message, with additional embed and field utility methods.
             */
            this.getEmbed = (index) => {
                let emb = this.embeds[index];
                emb.toString = () => JSON.stringify(emb);

                emb.getField = (f_index) => {

                    let field = emb.fields[f_index];

                    field.setName = (name) => {
                        field.name = name;
                        emb.fields[f_index] = field;
                        this.embeds[index] = emb;
                        this.edit({embed: this.embeds[index]});
                    };

                    field.setValue = (value) => {
                        field.value = value;
                        emb.fields[f_index] = field;
                        this.embeds[index] = emb;
                        this.edit({embed: this.embeds[index]});
                    };

                    return field;

                };

                return emb;
            };

            //Set accessible Elisif systems

            this.interface = this.elisif.interface;
            this.interpreter = this.elisif.interpreter;
            this.evg = this.elisif.evg;
            this.database = this.evg.resolve;
            this.db = this.database;
            this.dbAsync = this.evg.from;
            this.dbJson = this.evg.cache;
            this.dbDynamic = this.evg.remodel;
            this.getGlobalSetting = (sett) => this.elisif.settings.Global().get(sett);
            this.getLocalSetting = (sett) => this.elisif.settings.Local(this.guild?.id).get(sett);
            this.setGlobalSetting = (sett, val) => this.elisif.settings.Global().set(sett, val);
            this.setLocalSetting = (sett, val) => this.elisif.settings.Local(this.guild?.id).set(sett, val);

        }

        get prefix() {
            return this.guild ? this.elisif.settings.Local(this.guild.id).get("local_prefix") : this.client.prefix.get();
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

        hasComponents() {
            return this.components.length >= 1 && this.components[0].components.length >= 1;
        }

        get buttons() {
            return new ButtonManager(this);
        }

        get menus() {
            return new SelectMenuManager(this);
        }

        /**
         * Starts a Button Collector that runs the given method when a button in this message is clicked. Only one Button Collector can run on a specific message at a time.
         * @param {(button:ButtonComponent) => Boolean} func - The method to run when a button is clicked. The button is passed as the first argument.
         * @returns 
         */
        startButtonCollector(func) {
            if (this.components.find(row => row.components.find(c => c.custom_id)) && !this.#collecting) {

                this.#buttonCollector = (button) => {                 
                    if (this.#collecting && button.message.id == this.id) func(button);
                };

                this.#collecting = true;
                return this.client.on("buttonClick", this.#buttonCollector);
            }
            else return false;
        }

        /**
         * Ends the currently active Button Collector on this message, if there is one.
         * @returns Boolean (whether or not button collection ended)
         */
        endButtonCollector() {
            if (!this.#collecting) return false;

            this.client.removeListener("buttonClick", this.#buttonCollector);
            this.#collecting = false;

            return true;
        }

        stopButtonCollector = this.endButtonCollector;

        /**
         * Starts a Menu Collector that runs the given method when a select menu is used. Only one Menu Collector can run on a specific message at a time.
         * @param {(menu:SelectMenuComponent) => Boolean} func - The method to run when a select menu is used. The menu is passed as the first argument.
         * @returns 
         */
         startMenuCollector(func) {
            if (this.components.find(row => row.components.find(c => c.custom_id)) && !this.#menu_collecting) {

                this.#menuCollector = (menu) => {                 
                    if (this.#menu_collecting && menu.message.id == this.id) func(menu);
                };

                this.#menu_collecting = true;
                return this.client.on("menuSelect", this.#menuCollector);
            }
            else return false;
        }

        /**
         * Ends the currently active Menu Collector on this message, if there is one.
         * @returns Boolean (whether or not menu collection ended)
         */
        endMenuCollector() {
            if (!this.#menu_collecting) return false;

            this.client.removeListener("menuSelect", this.#menuCollector);
            this.#menu_collecting = false;

            return true;
        }

        stopMenuCollector = this.endMenuCollector;

        /**
         * Directly replies to the current message with a new message. Supports inline replies!
         * @param {String} content - The content of the reply message.
         * @param {Object} options - The reply's options.
         * @param {Boolean} [options.inline] - Whether or not this is an inline reply. Defaults to true.
         * @param {Boolean} [options.mention] - Whether or not this reply should mention/ping the user. Only applicable to inline replies. Defaults to true.
         * @returns Message
         */
        async reply(content, options) {

            options = options || {inline: true, mention: true};
            
            if (!("inline" in options)) options.inline = true;
            if (!("mention" in options)) options.mention = true;
            
            if (!options.inline) return super.reply(content);
            var suboptions = undefined;

            // Support for embed replies
            if (!["string", "number"].includes(typeof content)) {
                suboptions = content;
                content = undefined;
            }

            var template = APIMessage.create(this.channel, content, suboptions).resolveData();
            
            template.data.message_reference = { message_id: this.id };
            template.data.allowed_mentions = {
                parse: ["users", "roles", "everyone"],
                replied_user: options.mention
            };
            
            const { data, files } = await template.resolveFiles();
            return this.client.api.channels[this.channel.id].messages
                .post({ data, files })
                .then(d => this.client.actions.MessageCreate.handle(d).message);

        }

        async _editRaw(content, options = {}) {
            options = Object.assign(this._data, options);

            const template = APIMessage.create(this, content, options).resolveData();

            Object.assign(template.data, options);

            const {data, files} = await template.resolveFiles();

            return this.client.api.channels[this.channel.id].messages[this.id].patch({ data, files }).then(d => {
                const clone = this._clone();
                clone._patch(d);
                return clone;
            });
        }

        isExtended() {
            return true;
        }

        get client() {
            return this.elisif.Client ? this.elisif.Client.getInstance() : null;
        }

        get elisif() { return require("../index").getInstance(); }

    }

    return AdvancedMessage;
}

module.exports = ExtendedMessage;