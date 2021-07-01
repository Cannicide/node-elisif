//Contains various extensions of discord.js capabilities, including insertion of node-elisif methods and features.

const Discord = require('discord.js');
const { APIMessage, Message, WebhookClient } = require("discord.js");

class InteractionWebhookClient extends WebhookClient {

    async editMessage(content, options) {
        var api = APIMessage.create(this, content, options).resolveData();

        const { data, files } = await api.resolveFiles();

        return this.client.api
            .webhooks(this.id, this.token)
            .messages("@original")
            .patch({ data, files });
    }

}

class BtnMessageComponent {
  
    constructor(client, data) {

        this.client = client;

        this.id = data.data.custom_id;

        this._data = data;

        this.guild = data.guild_id ? client.guilds.cache.get(data.guild_id) : undefined;
        this.channel = client.channels.cache.get(data.channel_id);
        this.message = new Message(client, data.message, this.channel);
      
        if (data.token) {

            this._data.token = data.token;
            this._data.discordID = data.id;
            this._data.applicationID = data.application_id;
            this._webhook = new InteractionWebhookClient(data.application_id, data.token, client.options);

            /**
             * Respond to the button click with no interaction response; useful if you want to customize your response to the click instead of using interaction replies.
             */
            this.noReply = async () => {
                if (this.clickEnded) throw new Error('This button click was already ended; cannot reply again.');
                await this.client.api.interactions(this._data.discordID, this._data.token).callback.post({
                    data: {
                        type: 6,
                        data: {
                            flags: 1 << 6,
                        },
                    },
                });
                this.clickEnded = true;
            }

            /**
             * Sends an interaction reply message to the user who clicked the button. Supports ephemeral messages!
             * @param {*} content 
             * @param {*} ephemeral 
             * @param {*} options 
             */
            this.reply = async (content, ephemeral = false, options = {}) => {

                if (this.clickEnded) throw new Error('This button click was already ended; cannot reply again.');

                var type = 4;

                if (options.reply_type) {
                    type = options.reply_type;
                    delete options.reply_type;
                }

                let apiMessage = APIMessage.create(this.channel, content, options).resolveData();

                if (ephemeral) apiMessage.data.flags = 64;
                apiMessage.data.allowed_mentions = {
                    parse: ["users", "roles", "everyone"]
                };

                const { data, files } = await apiMessage.resolveFiles();
                await this.client.api.interactions(this._data.discordID, this._data.token).callback
                    .post({
                        data: {
                            data: data,
                            type: type
                        },
                        files
                    });
                this.clickEnded = true;

            }

            this._editReply = async (content, options) => {

                if (!this.clickEnded) throw new Error('This button click was not yet ended; cannot edit reply yet.');

                var output = await this._webhook.editMessage(content, options);

                return this.channel.messages.add(output);

            }

            /**
             * Sends a delayed interaction reply. The bot will be [thinking...] until the reply delivers. Supports ephemeral messages!
             * @param {*} content 
             * @param {*} ephemeral 
             * @param {*} timeout 
             * @param {*} options 
             */
            this.delayedReply = async (content, ephemeral = false, timeout = 5000, options = {}) => {
                options.reply_type = 5;
                this.reply(content, ephemeral, options);

                setTimeout(() => {
                    this._editReply(content, options);
                }, timeout)

            }

            this.clickEnded = false;
        }
    }
  
    get index() {
      
      var index = 0;
      var comp;
        
      this._data.message.components.forEach(row => {

        var newcomp = row.components.findIndex(c => c.custom_id && c.custom_id == this.id);
        
        if (!comp && newcomp < 0) {
          index+= row.components.length;
        }
        else if (!comp && newcomp >= 0) {
          index += newcomp;
          comp = true;
        }

      });
      
      return index;
      
    }
  
    get row() {
  
      var rowindex = this._data.message.components.findIndex(row => {

        return row.components.find(c => c.custom_id && c.custom_id == this.id);

      });
      
      return rowindex <= -1 ? false : rowindex + 1;
      
    }
  
    //Index within row, relative to the start of the row
    get rowIndex() {
      
      var row = this.row;
      
      if (!row) return false;
      
      var rowindex = this._data.message.components[row - 1].components.findIndex(c => c.custom_id && c.custom_id == this.id);
      
      return rowindex <= -1 ? false : rowindex;
      
    }
  
    get label() {
      
      var row = this.row;
      var rowIndex = this.rowIndex;
      
      if (!row || rowIndex === false) return false;
      
      return this._data.message.components[row - 1].components[rowIndex].label;
      
    }
  
    get user() {
      
      var user = this.client.users.resolve(this._data.user.id);
      user.fetch = async () => await this.client.users.fetch(this._data.user.id);
      
    }
  
    get member() {
      
      var member = this.guild ? this.guild.members.resolve(this._data.member.user.id) : undefined;
      if (member) member.fetch = async () => await this.guild.members.fetch(this._data.member.user.id);
      
    }
  
}

class MessageButtons {

    constructor(message) {
        this.message = message;
    }

    /**
     * 
     * @param {Number|{id:String}} [row] - Represents one of: row number, button index, or object with button id specified. If unspecified, gets all buttons in the message.
     * @param {Number} rowIndex - The index, within and relative to the specified row, of the button to get.
     * @returns BtnMessageComponent | BtnMessageComponent[] | false
     */
    get(row, rowIndex) {

        //Check if message has buttons:
        if (this.message.components.length < 1 || this.message.components[0].components.length < 1) return false;

        /*
            4 modes of getting button(s):
                1) (row, rowIndex) - using both row and index within row to get a single, specific button
                2) (index) - using simply index (out of all buttons across all rows) to get a single, specific button
                3) ({id:"custom id here"}) - using a button's custom id to get that specific button
                4) () - getting all buttons on the message in an array of BtnMessageComponents
        */
        var mode = 0;

        if (row && rowIndex) mode = 1;
        else if (row && typeof row === "number") mode = 2;
        else if (row && typeof row === "object" && "id" in row && row.id) mode = 3;
        else mode = 4;

        if (mode == 1) {

            var rowset = this.getRow(row);

            if (!rowset) return false;

            var buttondata = rowset[rowIndex];

            var simdata = {
                data: {
                    custom_id: buttondata.custom_id
                },
                components: this.message.components,
                message: this.message,
                channel_id: this.message.channel.id
            };

            if (this.message.guild) simdata.guild_id = this.message.guild.id;

            var button = new BtnMessageComponent(this.message.client, simdata);

            return button;

        }
        else if (mode == 2) {

            var index = -1;
            var buttondata = false;

            this.message.components.forEach(rowset => {

                rowset.components.forEach(btn => {

                    index++;

                    if (index == row) button = btn;

                });

            });

            var simdata = {
                data: {
                    custom_id: buttondata.custom_id
                },
                components: this.message.components,
                message: this.message,
                channel_id: this.message.channel.id
            };

            if (this.message.guild) simdata.guild_id = this.message.guild.id;

            var button = new BtnMessageComponent(this.message.client, simdata);

            return button;

        }
        else if (mode == 3) {

            var buttondata = false;

            this.message.components.forEach(rowset => {

                var btn = rowset.components.find(c => c.custom_id == row.id);

                if (btn) buttondata = btn;

            });

            var simdata = {
                data: {
                    custom_id: buttondata.custom_id
                },
                components: this.message.components,
                message: this.message,
                channel_id: this.message.channel.id
            };

            if (this.message.guild) simdata.guild_id = this.message.guild.id;

            var button = new BtnMessageComponent(this.message.client, simdata);

            return button;

        }
        else {

            var buttons = [];

            this.message.components.forEach(rowset => {

                rowset.components.forEach(buttondata => {

                    let simdata = {
                        data: {
                            custom_id: buttondata.custom_id
                        },
                        components: this.message.components,
                        message: this.message,
                        channel_id: this.message.channel.id
                    };
        
                    if (this.message.guild) simdata.guild_id = this.message.guild.id;

                    var button = new BtnMessageComponent(this.message.client, simdata);
                    buttons.push(button);

                });

            });

            return buttons;

        }

    }

    getRow(row) {

        var rowset = this.message.components[row - 1];

        return rowset ? rowset.components : false;

    }

    add(btnArr) {
        var components = Object.assign({}, this.message.components);

        var compArr = Array.isArray(btnArr) ? btnArr.map(v => buttonUtilities.genComponent(v)) : [buttonUtilities.genComponent(btnArr)];
        
        compArr.forEach(component => {
            
            var row = component.row;
            
            if (row > 4) throw new Error("Messages can only have up to 5 rows of buttons.");
            
            if (row >= components.length && !components[row]) {
            //Create new row
            components[row] = {
                type: 1,
                components: []
            };
            }
            
            delete component.row;
            components[row].components.push(component);
            
        });
        
        components = components.filter(co => co);

        return this.message._editRaw(this.message.content, {components});

    }

    remove(row, rowIndex) {
        var button = this.get(row, rowIndex);

        if (!button) return false;

        var components = Object.assign({}, this.message.components);

        components[button.row].components.splice(button.rowIndex, 1);

        return this.message._editRaw(this.message.content, {components});

    }

    edit(row, rowIndex, newProperties) {
        var button = this.get(row, rowIndex);

        if (!button) return false;

        var components = Object.assign({}, this.message.components);

        components[button.row].components[button.rowIndex] = Object.assign(components[button.row].components[button.rowIndex], newProperties);

        return this.message._editRaw(this.message.content, {components});
    }

    enable(row, rowIndex) {
        return this.edit(row, rowIndex, {disabled: false});
    }

    disable(row, rowIndex) {
        return this.edit(row, rowIndex, {disabled: true});
    }

}


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
            this.components = data.components;
            this._data = data;
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

        buttons = new MessageButtons(this);

        /**
         * Directly replies to the current message with a new message. Supports inline replies!
         * @param {String} content - The content of the reply message.
         * @param {Object} options - The reply's options.
         * @param {Boolean} [options.inline] - Whether or not this is an inline reply. Defaults to false (a plain discord.js text reply).
         * @param {Boolean} [options.mention] - Whether or not this reply should mention/ping the user. Only applicable to inline replies. Defaults to true.
         * @returns Message
         */
        async reply(content, options) {

            options = options || {inline: false, mention: true};
            
            if (!("inline" in options)) options.inline = false;
            if (!("mention" in options)) options.mention = true;
            
            if (!options.inline) return super.reply(content);
            
            var template = APIMessage.create(this.channel, content, undefined).resolveData();
            
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

        _editRaw(content, options = {}) {
            options = Object.assign(this._data, options);

            const { data } = APIMessage.create(this, content, options).resolveData();
            return this.client.api.channels[this.channel.id].messages[this.id].patch({ data }).then(d => {
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

        get elisif() { return require("./index").getInstance(); }

    }

    return AdvancedMessage;
}

const buttonUtilities = {
    prevID: 1000000,

    genID() {
        var id = "ELISIFBTN" + (buttonUtilities.prevID++);
        return id;
    },

    resolveEmoji(emoji) {
        var emote = {
            name: null,
            id: null
        }
        
        if (!emoji) emote = null; 
        else if (emoji.id) emote.id = emoji.id;
        else if (isNaN(emoji)) emote.name = emoji;
        else emote.id = emoji;
        
        if (emoji && emoji.animated) emote.animated = emoji.animated;
        
        return emote;
    },

    convertColor(color) {
        var values = {
        "blue": 1,
        "blurple": 1,
        "primary": 1,
        "gray": 2,
        "grey": 2,
        "secondary": 2,
        "green": 3,
        "success": 3,
        "red": 4,
        "danger": 4,
        "link": 5,
        "url": 5
        }
        
        return values[color.toLowerCase()];
    },

    genComponent(options) {
        
        options = options || {
            color: "url",
            emoji: "",
            label: "[No label set]",
            disabled: false,
            url: "https://google.com",
            id: false,
            row: 1
        };
        
        if (!("color" in options)) {
            options.color = "blue";
        }
        
        if ("url" in options) {
            options.color = "url";
            options.id = undefined;
        }
        else {
            if (!options.id) {
            options.id = buttonUtilities.genID();
            }
            
            options.url = undefined;
        }
        
        if (!("label" in options)) options.label = "[No label set]";
        else if (options.label.length > 80) options.label = "[Label too large]";
        
        if (!("row" in options)) options.row = 1;
        
        var component = {
            type: 2,
            style: buttonUtilities.convertColor(options.color),
            label: options.label,
            emoji: buttonUtilities.resolveEmoji(options.emoji),
            custom_id: options.id,
            url: options.url,
            disabled: options.disabled,
            row: options.row - 1
        };
        
        return component;
    
    }

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
         * @param {Object} options - Options to construct the Embed object to paginate.
         * @param {Object[]} elements - Array of fields to cycle through when paginating
         * @param {String} elements[].name - Field title
         * @param {String} elements[].value - Field content
         * @param {Number} perPage - Number of elements per page
         */
        paginate(options, elements, perPage) {
            let embed = new (require("./interface").Embed)(this.lastMessage, options);
            return new (require("./interface").Paginator)(this.lastMessage, embed, elements, perPage);
        }

        /**
         * Sends a message with one or more buttons attached.
         * @param {Object} embedOptions - Options for the message itself. Uses the same options as TextChannel#embed().
         * @param {Object[]} btnArr - An array of options for multiple buttons, or options for a single button.
         * @param {String} [btnArr[].color] - Optional color of the button. Defaults to blue.
         * @param {String} [btnArr[].emoji] - Optional emoji of the button. There is no emoji by default.
         * @param {String} [btnArr[].label] - Label of the button. Label becomes "[No label set]" if unspecified.
         * @param {String} [btnArr[].disabled] - Whether or not the button is disabled. Defaults to false.
         * @param {String} [btnArr[].url] - The optional URL this button leads to. Using this property overrides color and ID.
         * @param {String} [btnArr[].id] - The optional custom ID of this button. If unspecified, Elisif generates an unique ID for you.
         * @param {String} [btnArr[].row] - The optional row of buttons, or "action row", to add this button to. Defaults to 1.
         */
        async button(embedOptions, btnArr) {

            var embed = new (require("./interface").Embed)(this.lastMessage, embedOptions);

            var compArr = Array.isArray(btnArr) ? btnArr.map(v => buttonUtilities.genComponent(v)) : [buttonUtilities.genComponent(btnArr)];
            var components = [];
            
            compArr.forEach(component => {
                
                var row = component.row;
                
                if (row > 4) throw new Error("Messages can only have up to 5 rows of buttons.");
                
                if (row >= components.length && !components[row]) {
                //Create new row
                components[row] = {
                    type: 1,
                    components: []
                };
                }
                
                delete component.row;
                components[row].components.push(component);
                
            });
            
            components = components.filter(co => co);
            
            var template = APIMessage.create(this, embed.content, embed).resolveData();
            
            template.data.components = components;
            
            const { data, files } = await template.resolveFiles();
            var rawData = await this.client.api.channels[this.id].messages
                .post({ data, files });
            var output = this.client.actions.MessageCreate.handle(rawData).message;
            
            if (compArr.find(c => c.custom_id)) {
                
                var buttonCollector = function(button) {
                    if (!compArr.find(c => c.custom_id == button.id)) return;
                    
                    if (output.collecting) this.collect(button);
                }
                
                output.collecting = false;
                
                /**
                 * @param {Function} func
                 */
                output.startButtonCollector = (func) => {
                    if (output.collecting) return;
                    this.client.on("buttonClick", buttonCollector.bind({collect: func}));
                    output.collecting = true;
                }
                
                output.endButtonCollector = () => {
                    this.client.removeListener("buttonClick", buttonCollector.bind({collect: function(){}}));
                    output.collecting = false;
                }
                
            }
            
            return output;

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

    static extendEvents(client) {

        //buttonClick event
        client.ws.on('INTERACTION_CREATE', (data) => {
            if (!data.message) return;
            if (data.data.component_type) {
                const buttonMsg = new BtnMessageComponent(client, data);
                client.emit('buttonClick', buttonMsg);
            }
        });

    }

}