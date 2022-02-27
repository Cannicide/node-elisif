
const StructureUtility = require("./StructureUtility");
const ButtonManager = require("../managers/UtilButtonManager");
const SelectManager = require("../managers/UtilSelectManager");

class MessageUtility extends StructureUtility {

    #setFlags;
    #userArgs;
    #cooldownTimeLeft = 0;
    #cooldownLastUse = 0;
    #buttonCollectors = new Map();
    #menuCollectors = new Map();

    /**
     * @param {import("./Utility")} util
    */
    constructor(message, util, interaction) {

        super(message, util);

        this.message = message;
        this.guild = message.guild;
        this.channel = message.channel;
        this.baseInteraction = interaction ?? null;

        //Determine args and command

        var components = this.message.content.split(" ");
        var commandWithPrefix = components[0].toLowerCase();
        var args = components.slice(1);

        var escapedPrefix = this.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
            let emb = this.message.embeds[index];
            emb.toString = () => JSON.stringify(emb);

            emb.getField = (f_index) => {

                let field = emb.fields[f_index];

                field.setName = (name) => {
                    field.name = name;
                    emb.fields[f_index] = field;
                    this.message.embeds[index] = emb;
                    this.message.edit({embed: this.message.embeds[index]});
                };

                field.setValue = (value) => {
                    field.value = value;
                    emb.fields[f_index] = field;
                    this.message.embeds[index] = emb;
                    this.message.edit({embeds: this.message.embeds});
                };

                return field;

            };

            return emb;
        };

        //Set accessible Elisif systems

        this.interface = this.elisif.interface;
        this.interpreter = this.elisif.interpreter;
        this.evg = this.elisif.evg;
        this.db = this.evg;
        this.getGlobalSetting = (sett) => this.client.settings.Global().get(sett);
        this.getLocalSetting = (sett) => this.client.settings.Local(this.guild?.id).get(sett);
        this.setGlobalSetting = (sett, val) => this.client.settings.Global().set(sett, val);
        this.setLocalSetting = (sett, val) => this.client.settings.Local(this.guild?.id).set(sett, val);

        //Add this utility object to the map, mapped with the message ID
        this.set();
    }

    getMessage() {
        return this.message;
    }

    get prefix() {
        return this.guild ? this.client.settings.Local(this.guild.id).get("local_prefix") || this.client.prefix.get() : this.client.prefix.get();
    }

    hasComponents() {
        return this.message.components.length >= 1 && this.message.components[0].components.length >= 1;
    }

    /**
     * Returns all valid flags found in this message.
     * Ex: "My name is -f Bob -rt" would return ["-f", "-rt"].
     * Valid flags must be set by setValidFlags() before searching with this property.
     */
     get cmdFlags() {
        //Find message flags

        var foundFlags = undefined;

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
        return flags?.includes(flag);
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

    /**
     * Starts a Button Collector that runs the given method when a button in this message is clicked. Multiple Button Collectors can now run on a specific message at a time.
     * @param {(button:ButtonComponent) => Boolean} func - The method to run when a button is clicked. The button is passed as the first argument.
     * @returns 
     */
     startButtonCollector(func) {

        let uuid = Date.now();
        while (this.#buttonCollectors.has(uuid)) uuid++;

        if (this.message.components.find(row => row.components.find(c => c.type == "BUTTON")) && !this.#buttonCollectors.has(uuid)) {

            let collector = (button) => {                 
                if (this.#buttonCollectors.has(uuid) && button.message.id == this.message.id) func(button);
            };

            this.client.on("buttonClick", collector);
            this.#buttonCollectors.set(uuid, collector);
        }

        return uuid;
    }

    /**
     * Ends the currently active Button Collector with the given uuid on this message, if it exists.
     * @returns Boolean (whether or not button collection ended)
     */
    endButtonCollector(uuid) {
        if (!this.#buttonCollectors.has(uuid)) return false;

        this.client.removeListener("buttonClick", this.#buttonCollectors.get(uuid));
        this.#buttonCollectors.delete(uuid);

        return true;
    }

    /**
     * Starts a Menu Collector that runs the given method when a select menu is used. Multiple Menu Collectors can now run on a specific message at a time.
     * @param {(menu:SelectMenuComponent) => Boolean} func - The method to run when a select menu is used. The menu is passed as the first argument.
     * @returns 
     */
     startMenuCollector(func) {

        let uuid = Date.now();
        while (this.#menuCollectors.has(uuid)) uuid++;

        if (this.message.components.find(row => row.components.find(c => c.type == "SELECT_MENU")) && !this.#menuCollectors.has(uuid)) {

            let collector = (menu) => {                 
                if (this.#menuCollectors.has(uuid) && menu.message.id == this.message.id) func(menu);
            };

            this.client.on("menuSelect", collector);
            this.#menuCollectors.set(uuid, collector);
        }

        return uuid;
    }

    /**
     * Ends the currently active Menu Collector with the given uuid on this message, if it exists.
     * @returns Boolean (whether or not menu collection ended)
     */
    endMenuCollector(uuid) {

        if (!this.#menuCollectors.has(uuid)) return false;

        this.client.removeListener("menuSelect", this.#menuCollectors.get(uuid));
        this.#menuCollectors.delete(uuid);

        return true;
    }

    deleteTimeout(seconds) {
        setTimeout(() => {
            this.message.delete();
        }, seconds * 1000);
    }

    get author() {
        return this.message.author;
    }

    //Message Component Shortcuts:

    buttonHandler = ({authors = [this.baseInteraction?.user.id], allUsersCanClick = false, disableOnEnd = true, maxClicks = 0, time = 5, ids = this.buttons.get().map(btn => btn.asComponent().customId)}, resolve = () => {}, reject = () => {}) => {

        let collected = false;
        let clicks = 0;
        let ended = false;
    
        let endButtonHandler = (reject) => {
            if (ended) return;
            this.endButtonCollector(uuid);
            ended = true;
            if (disableOnEnd) ids.forEach(id => this.buttons.get({customId: id}).disable());
    
            if (collected) return;
            reject(`User did not click a button within ${time} minutes.`);
        }

        let uuid = this.startButtonCollector(button => {

            if (ended) return;
            if (maxClicks && clicks >= maxClicks) return;
            if (!ids.includes(button.customId) || (!allUsersCanClick && !authors.includes(button.user.id))) return;

            collected = true;
            this.util.Component(button);
            resolve(button);

            if (maxClicks && ++clicks >= maxClicks) endButtonHandler();

        });

        setTimeout(() => endButtonHandler(reject), time * 60 * 1000);
    }

    menuHandler = ({authors = [this.baseInteraction?.user.id], allUsersCanSelect = false, disableOnEnd = true, time = 5, ids = this.menus.get().map(m => m.asComponent().customId)}, resolve = () => {}, reject = () => {}) => {

        let collected = false;
        let ended = false;
    
        let endMenuHandler = (reject) => {
            if (ended) return;
            this.endMenuCollector(uuid);
            ended = true;
            if (disableOnEnd) ids.forEach(id => this.menus.get({customId: id}).disable());
    
            if (collected) return;
            reject(`User did not use the menu within ${time} minutes.`);
        }

        let uuid = this.startMenuCollector(menu => {

            if (ended) return;
            if (!ids.includes(menu.customId) || (!allUsersCanSelect && !authors.includes(menu.user.id))) return;

            collected = true;
            this.util.Component(menu);
            resolve(menu);
            endMenuHandler();

        });

        setTimeout(() => endMenuHandler(reject), time * 60 * 1000);
    }

    //Message Components:

    get buttons() {
        return new ButtonManager(this.message, this);
    }
    
    get menus() {
        return new SelectManager(this.message, this);
    }

    //Structure Utility Methods:

    Member() {
        return this.util.Member(this.message.member);
    }

    Channel() {
        return this.util.Channel(this.message.channel, this.message);
    }

    Guild() {
        return this.util.Guild(this.message.guild);
    }

}

module.exports = MessageUtility;