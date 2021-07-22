//Contains various extensions of discord.js capabilities, including insertion of node-elisif methods and features.

const Discord = require('discord.js');
const { APIMessage, Message, WebhookClient } = require("discord.js");
const evg = require("./evg")

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

class MessageComponent {

    constructor(client, data) {

        this.client = client;

        this.id = data.data.custom_id;
        this.type = data.data.component_type;

        this._data = data;

        this.guild = data.guild_id ? client.guilds.cache.get(data.guild_id) : undefined;
        this.channel = client.channels.cache.get(data.channel_id);
        this.message = data.true_message ? data.true_message : new Message(client, data.message, this.channel);
        if (data.true_message) this._data.message = data.true_message;

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

    asComponent() {
      
        var row = this.row;
        var rowIndex = this.rowIndex;
        
        if (!row || rowIndex === false) return undefined;
        
        return this._data.message.components[row - 1].components[rowIndex];
        
    }

    get user() {
      
        var user = this.client.users.resolve(this._data.member.user.id);
        user.fetch = async () => await this.client.users.fetch(this._data.member.user.id);

        return user;
        
    }
    
    get member() {
    
        var member = this.guild ? this.guild.members.resolve(this._data.member.user.id) : undefined;
        if (member) member.fetch = async () => await this.guild.members.fetch(this._data.member.user.id);

        return member;
    
    }

}

class BtnMessageComponent extends MessageComponent {
  
    constructor(client, data) {

        super(client, data);
      
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

            this.editReply = async (content, options) => {

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
                    this.editReply(content, options);
                }, timeout)

            }

            this.clickEnded = false;
        }
    }
  
    get label() {
      
      return this.asComponent().label;
      
    }

    get disabled() {
        
        var comp = this.asComponent();

        if (!comp) return undefined;

        return !("disabled" in comp) || !comp.disabled ? false : true;
    
    }

    get style() {
      
        var comp = this.asComponent();
        
        if (!comp) return undefined;
        
        return buttonUtilities.deconvertColor(comp.style);
    
    }

    get color() {
        return this.style;
    }
  
}

class SelectMenuComponent extends MessageComponent {
  
    constructor(client, data) {

        super(client, data);

        this.selected = data.data.values;
        this.message.selected = this.selected
      
        if (data.token) {

            this._data.token = data.token;
            this._data.discordID = data.id;
            this._data.applicationID = data.application_id;
            this._webhook = new InteractionWebhookClient(data.application_id, data.token, client.options);

            /**
             * Respond to the selection with no interaction response; useful if you want to customize your response instead of using interaction replies.
             */
            this.noReply = async () => {
                if (this.clickEnded) throw new Error('This menu select was already ended; cannot reply again.');
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
             * Sends an interaction reply message to the user who used the select menu. Supports ephemeral messages!
             * @param {*} content 
             * @param {*} ephemeral 
             * @param {*} options 
             */
            this.reply = async (content, ephemeral = false, options = {}) => {

                if (this.clickEnded) throw new Error('This menu select was already ended; cannot reply again.');

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

            this.editReply = async (content, options) => {

                if (!this.clickEnded) throw new Error('This menu select was not yet ended; cannot edit reply yet.');

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
                    this.editReply(content, options);
                }, timeout)

            }

            this.clickEnded = false;
        }
    }
  
    //Index within row, relative to the start of the row; always 0 for select menus
    rowIndex = 0;

    get max() {
        return this.asComponent().max_values;
    }

    get min() {
        return this.asComponent().min_values;
    }

    get options() {
        return this.asComponent().options;
    }

    getOptionByValue(value) {
        return this.options.find(option => option.value == value);
    }

    get placeholder() {
        return this.asComponent().placeholder;
    }
  
}

class ButtonManager {

    constructor(message) {
        this.message = message;
    }

    has() {
        return this.message.hasComponents() && this.message.components.find(v => v.components.find(c => c.type == 2));
    }

    /**
     * 
     * @param {Number|{id:String}} [row] - Represents one of: row number, button index, or object with button id specified. If unspecified, gets all buttons in the message.
     * @param {Number} rowIndex - The index, within and relative to the specified row, of the button to get.
     * @returns BtnMessageComponent | BtnMessageComponent[] | false
     */
    get(row, rowIndex) {

        //Check if message has buttons:
        if (!this.has()) return false;

        /*
            4 modes of getting button(s):
                1) (row, rowIndex) - using both row and index within row to get a single, specific button
                2) (index) - using simply index (out of all buttons across all rows) to get a single, specific button
                3) ({id:"custom id here"}) - using a button's custom id to get that specific button
                4) () - getting all buttons on the message in an array of BtnMessageComponents
        */
        var mode = 0;

        if (row && rowIndex) mode = 1;
        else if (row != undefined && typeof row === "number") mode = 2;
        else if (row && typeof row === "object" && "id" in row && row.id) mode = 3;
        else mode = 4;

        if (mode == 1) {

            var rowset = this.getRow(row);

            if (!rowset) return false;

            var buttondata = rowset[rowIndex];

            var simdata = {
                data: {
                    custom_id: buttondata.custom_id,
                    component_type: buttondata.type
                },
                components: this.message.components,
                true_message: this.message,
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

                    if (index == row) buttondata = btn;

                });

            });

            var simdata = {
                data: {
                    custom_id: buttondata.custom_id,
                    component_type: buttondata.type
                },
                components: this.message.components,
                true_message: this.message,
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
                    custom_id: buttondata.custom_id,
                    component_type: buttondata.type
                },
                components: this.message.components,
                true_message: this.message,
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
                            custom_id: buttondata.custom_id,
                            component_type: buttondata.type
                        },
                        components: this.message.components,
                        true_message: this.message,
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
        var components = this.message.components;

        var openRow = components.findIndex(v => v.components.length < 5);
        buttonUtilities.prevRow = openRow < 0 ? (components.length < 5 ? components.length + 1 : 5) : (openRow + 1) + ((components[openRow].components.length - 1) * 0.2);

        if (buttonUtilities.prevRow >= 5.8) throw new Error("message.buttons#add() - A single message cannot have more than 5 rows of buttons.");

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

        var components = this.message.components;

        components[button.row - 1].components.splice(button.rowIndex, 1);

        if (components[button.row - 1].components.length <= 0) components.splice(button.row - 1, 1);

        return this.message._editRaw(this.message.content, {components});

    }

    edit(row, rowIndex, newProperties) {
        var button = this.get(row, rowIndex);

        if (!button) return false;

        var components = this.message.components;

        Object.assign(components[button.row - 1].components[button.rowIndex], newProperties);

        return this.message._editRaw(this.message.content, {components});
    }

    enable(row, rowIndex) {
        return this.edit(row, rowIndex, {disabled: false});
    }

    disable(row, rowIndex) {
        return this.edit(row, rowIndex, {disabled: true});
    }

    permDisable(row, rowIndex) {
        return this.edit(row, rowIndex, {disabled: true, style: buttonUtilities.convertColor("gray")});
    }

    toggleDisabled(row, rowIndex, timeout = false) {
        var button = this.get(row, rowIndex)
        
        if (!button) return false;

        var disabled = button.disabled;

        if (disabled == undefined) return false;

        var output = this.edit(row, rowIndex, {disabled: !disabled});

        if (timeout) setTimeout(() => {this.toggleDisabled(row, rowIndex, false)}, timeout);
        else return output;
    }

    setColor(row, rowIndex, color) {

        var button = this.get(row, rowIndex)
        
        if (!button) return false;

        var style = button.style;

        if (!style || !color || style == color) return false;
        if (style == "url") throw new Error("message.buttons#setColor() - Cannot set color of a URL button.");
        if (color.toLowerCase() == "url" || color.toLowerCase() == "link") throw new Error("message.buttons#setColor() - Cannot set style of regular button to 'URL'.");

        return this.edit(row, rowIndex, {style: buttonUtilities.convertColor(color)});

    }

    setStyle = this.setColor;

    setLabel(row, rowIndex, label) {

        var button = this.get(row, rowIndex)
        
        if (!button) return false;

        var currLabel = button.label;

        if (currLabel == label) return false;
        if (label == "" || !(typeof label === "string") || label.length > 80) throw new Error("message.buttons#setLabel() - Invalid label specified; is empty, too long, or not a String.");

        return this.edit(row, rowIndex, {label});

    }

}

class SelectMenuManager {

    constructor(message) {
        this.message = message;
    }

    has() {
        return this.message.hasComponents() && this.message.components.find(v => v.components.find(c => c.type == 3));
    }

    /**
     * 
     * @param {Number|{id:String}} [row] - Represents one of: sel index, or object with sel id specified. If unspecified, gets all sels in the message.
     * @returns SelectMenuComponent | SelectMenuComponent[] | false
     */
    get(row) {

        //Check if message has select menus:
        if (!this.has()) return false;

        /*
            4 modes of getting sel(s):
                1) (index) - using index to get a single, specific sel menu
                2) ({id:"custom id here"}) - using a sel menu's custom id to get that specific sel menu
                3) () - getting all sel menus on the message in an array of SelectMenuComponents
        */
        var mode = 0;

        if (row != undefined && typeof row === "number") mode = 1;
        else if (row && typeof row === "object" && "id" in row && row.id) mode = 2;
        else mode = 3;

        
        if (mode == 1) {

            var index = -1;
            var seldata = false;

            this.message.components.forEach(rowset => {

                rowset.components.forEach(sel => {

                    index++;

                    if (index == row) seldata = sel;

                });

            });

            var simdata = {
                data: {
                    custom_id: seldata.custom_id,
                    values: this.message.selected ? this.message.selected : [],
                    component_type: seldata.type
                },
                components: this.message.components,
                true_message: this.message,
                channel_id: this.message.channel.id
            };

            if (this.message.guild) simdata.guild_id = this.message.guild.id;

            var menu = new SelectMenuComponent(this.message.client, simdata);

            return menu;

        }
        else if (mode == 2) {

            var seldata = false;

            this.message.components.forEach(rowset => {

                var sel = rowset.components.find(c => c.custom_id == row.id);

                if (sel) seldata = sel;

            });

            var simdata = {
                data: {
                    custom_id: seldata.custom_id,
                    values: this.message.selected ? this.message.selected : [],
                    component_type: seldata.type
                },
                components: this.message.components,
                true_message: this.message,
                channel_id: this.message.channel.id
            };

            if (this.message.guild) simdata.guild_id = this.message.guild.id;

            var menu = new SelectMenuComponent(this.message.client, simdata);

            return menu;

        }
        else {

            var menus = [];

            this.message.components.forEach(rowset => {

                rowset.components.forEach(seldata => {

                    let simdata = {
                        data: {
                            custom_id: seldata.custom_id,
                            values: this.message.selected ? this.message.selected : [],
                            component_type: seldata.type
                        },
                        components: this.message.components,
                        true_message: this.message,
                        channel_id: this.message.channel.id
                    };
        
                    if (this.message.guild) simdata.guild_id = this.message.guild.id;

                    var menu = new SelectMenuComponent(this.message.client, simdata);
                    menus.push(menu);

                });

            });

            return menus;

        }

    }

    add(selArr) {
        var components = this.message.components;

        selUtilities.prevRow = components.length + 1;

        if (selUtilities.prevRow >= 6) throw new Error("message.menus#add() - A single message cannot have more than 5 rows of select menus.");

        var compArr = Array.isArray(selArr) ? selArr.map(v => selUtilities.genComponent(v)) : [selUtilities.genComponent(selArr)];
        
        compArr.forEach(component => {
            
            var row = component.row;
            
            if (row > 4) throw new Error("Messages can only have up to 5 rows of select menus.");
            
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

    remove(index) {
        var menu = this.get(index);

        if (!menu) return false;

        var components = this.message.components;

        if (components[menu.row - 1].components.length <= 1) components.splice(menu.row - 1, 1);
        else components[menu.row - 1].components.splice(menu.rowIndex, 1);

        return this.message._editRaw(this.message.content, {components});

    }

    edit(index, newProperties) {
        var menu = this.get(index);

        if (!menu) return false;

        var components = this.message.components;

        Object.assign(components[menu.row - 1].components[menu.rowIndex], newProperties);

        return this.message._editRaw(this.message.content, {components});
    }

    setPlaceholder(index, placeholder) {
        return this.edit(index, {placeholder});
    }

    setMin(index, min) {
        return this.edit(index, {min_values: min});
    }

    setMax(index, max) {
        return this.edit(index, {max_values: max});
    }

    options = {
        menu: this,
        /**
         * Adds an option to the specified select menu.
         * @param {Number|SelectMenuComponent} index - Represents either the index of the select menu, or a Select Menu object.
         * @param {Object} option - A single option to add to the select menu.
         * @param {String} option.label - Label for this selectable option.
         * @param {String} [option.value] - Optional hidden value for this selectable option, for your dev purposes. Defaults to the label.
         * @param {String} [option.description] - Optional description for this selectable option. No description by default.
         * @param {String} [option.emoji] - Optional emoji for this selectable option. No emoji by default.
         * @param {String} [option.default] - Whether or not this selectable option is selected by default.
         */
        add(index, option) {
            var menu = this.menu.get(index);

            var options = menu.options;
            options.push(option);

            return this.menu.edit(index, {options});
        },

        /**
         * Removes an option from the specified select menu.
         * @param {Number|SelectMenuComponent} index - Represents either the index of the select menu, or a Select Menu object.
         * @param {String} value - The value property, of the option to be removed.
         */
        remove(index, value) {
            var menu = this.menu.get(index);

            var options = menu.options;

            if (options.length == 1) throw new Error("message.menus.options#remove() - Cannot remove the only option of a select menu.");

            var findex = options.findIndex(option => option.value == value);

            if (findex < 0) return false;

            options.splice(findex, 1);

            return this.menu.edit(index, {options});

        },

        get(index, value) {
            var menu = this.menu.get(index);

            return menu.getOptionByValue(value);
        }
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
            this.components = data.components;
            this._data = data;
            this.defaultFlags = data.flags;
            this.#userArgs = args; //(Read-only args)

            this.isCommand = () => this.label && this.client.commands.get(this.label);
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

            //Set accessible Elisif systems

            this.interface = require("./interface");
            this.interpreter = require("./interpreter");
            this.evg = require("./evg");
            this.database = require("./evg").resolve;
            this.db = this.database;
            this.dbAsync = require("./evg").from;
            this.dbJson = require("./evg").cache;
            this.dbDynamic = require("./evg").remodel;
            this.getGlobalSetting = (sett) => require("./settings").Global().get(sett);

        }

        get prefix() {
            var localPrefix = require("./settings").Local(this.guild.id).get("local_prefix");
            if (!localPrefix) localPrefix = require("./settings").Global().get("global_prefix");

            return localPrefix;
        }

        /**
         * The same as the default embeds property, but with additional field utility methods.
         */
        get embeds() {

            let embeds = super.embeds;

            embeds.forEach((emb, index) => {
                emb.toString = () => JSON.stringify(emb);

                emb.fields.forEach((field, f_index) => {

                    field.setName = (name) => {
                        field.name = name;
                        emb.fields[f_index] = field;
                        embeds[index] = emb;
                        super.embeds[index] = emb;
                        this.edit({embed: embeds[index]});
                    };

                    field.setValue = (value) => {
                        field.value = value;
                        emb.fields[f_index] = field;
                        embeds[index] = emb;
                        super.embeds[index] = emb;
                        this.edit({embed: embeds[index]});
                    };

                });
                
                emb.fields.get = (f_index) => {
                  
                  let field = emb.fields[f_index];
                  return field;
              
                };
            });

            embeds.get = (index) => {
                let emb = embeds[index];
                return emb;
            }

            return embeds;

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
         * @param {(button:BtnMessageComponent) => Boolean} func - The method to run when a button is clicked. The button is passed as the first argument.
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

        get elisif() { return require("./index").getInstance(); }

    }

    return AdvancedMessage;
}

const buttonUtilities = {
    db: evg.resolve("utility"),

    get id() {
        var tab = this.db.table("extendables");
        if (!tab.has("component_id")) tab.set("component_id", 1000000);

        var current = tab.get("component_id");
        tab.add("component_id", 1);

        return current;
    },

    genID() {
        var id = "ELISIFBTN" + (buttonUtilities.id);
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

    colorValues: {
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
    },

    numToColor: {
        1: "blue",
        2: "gray",
        3: "green",
        4: "red",
        5: "url"
    },

    convertColor(color) {
        
        return buttonUtilities.colorValues[color.toLowerCase()];
    },

    deconvertColor(num) {

        return buttonUtilities.numToColor[num];

    },

    prevRow: 1,

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
        
        if (!("color" in options) || !options.color) {
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
        
        if (!("label" in options) || !options.label) options.label = "[No label set]";
        else if (options.label.length > 80) options.label = "[Label too large]";
        
        if (!("row" in options) || !options.row) options.row = Math.floor(buttonUtilities.prevRow += 0.2);
        
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

const selUtilities = {
    
    genID() {
        var id = "ELISIFSEL" + (buttonUtilities.id);
        return id;
    },

    resolveEmoji(emoji) {
        return buttonUtilities.resolveEmoji(emoji);
    },

    prevRow: 1,

    genComponent(settings) {
        
        settings = settings || {
            placeholder: "",
            min: 1,
            max: 1,
            options: [
                {
                    label: "[No label set]",
                    value: "none",
                    description: "No options were specified for this Select Menu.",
                    emoji: "",
                    default: true
                }
            ],
            id: false,
            row: 1
        };
        
        if (!("placeholder" in settings) || !settings.placeholder) {
            settings.placeholder = "Select an option...";
        }

        if (!("min" in settings) || !settings.min) settings.min = 1;
        if (!("max" in settings) || !settings.max) settings.max = 1;
        
        if (!("options" in settings) || !settings.options) {
            settings.options = [];
            settings.options.push({
                label: "[No label set]",
                value: "none",
                description: "No options were specified for this Select Menu.",
                emoji: "",
                default: true
            });
        }

        if (!("id" in settings) || !settings.id) {
            settings.id = selUtilities.genID();
        }

        settings.options.forEach(options => {
        
            if (!("label" in options) || !options.label) options.label = "[No label set]";
            else if (options.label.length > 25) options.label = "[Label too large]";

            if (!("value" in options) || !options.value) options.value = options.label;
            else if (options.value.length > 100) throw new Error("Select Menu Option value too large for: " + `${options.label}`);

            if ("emoji" in options && options.emoji) options.emoji = selUtilities.resolveEmoji(options.emoji);

        });
        
        if (!("row" in settings) || !settings.row) settings.row = selUtilities.prevRow++;
        
        var component = {
            type: 3,
            custom_id: settings.id,
            row: settings.row - 1,
            options: settings.options,
            placeholder: settings.placeholder,
            min_values: settings.min,
            max_values: settings.max
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
         * @param {Number} [btnArr[].row] - The optional row of buttons & menus, or "action row", to add this button to. If unspecified, Elisif will select the next available row.
         */
        async button(embedOptions, btnArr) {

            var embed = new (require("./interface").Embed)(this.lastMessage, embedOptions);

            buttonUtilities.prevRow = 1;

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
            
            return output;

        }

        /**
         * Sends a message with one or more select menus attached.
         * @param {Object} embedOptions - Options for the message itself. Uses the same options as TextChannel#embed().
         * @param {Object[]} selArr - An array of options for multiple select menus, or options for a single select menu.
         * @param {String} [selArr[].placeholder] - Optional placeholder text of the select menu.
         * @param {Number} [selArr[].min] - Optional minimum number of options to be selected. Defaults to 1.
         * @param {Number} [selArr[].max] - Optional maximum number of options to be selected. Defaults to 1.
         * @param {Object[]} selArr[].options - The selectable options for this select menu.
         * @param {String} selArr[].options[].label - Label for this selectable option.
         * @param {String} [selArr[].options[].value] - Optional hidden value for this selectable option, for your dev purposes. Defaults to the label.
         * @param {String} [selArr[].options[].description] - Optional description for this selectable option. No description by default.
         * @param {String} [selArr[].options[].emoji] - Optional emoji for this selectable option. No emoji by default.
         * @param {String} [selArr[].options[].default] - Whether or not this selectable option is selected by default.
         * @param {String} [selArr[].id] - The optional custom ID of this select menu. If unspecified, Elisif generates an unique ID for you.
         * @param {Number} [selArr[].row] - The optional row of buttons & menus, or "action row", to add this select menu to. If unspecified, Elisif will select the next available row.
         */
         async selectMenu(embedOptions, selArr) {

            var embed = new (require("./interface").Embed)(this.lastMessage, embedOptions);

            selUtilities.prevRow = 1;

            var compArr = Array.isArray(selArr) ? selArr.map(v => selUtilities.genComponent(v)) : [selUtilities.genComponent(selArr)];
            var components = [];
            
            compArr.forEach(component => {
                
                var row = component.row;
                
                if (row > 4) throw new Error("Messages can only have up to 5 rows of select menus.");
                
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

            output.selected = false;
            
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

        const { Events } = require('discord.js').Constants;

        Events.BUTTON_CLICK = 'buttonClick';

        //buttonClick event
        client.ws.on('INTERACTION_CREATE', (data) => {
            if (!data.message) return;

            //Type 2 = button
            if (data.data.component_type && data.data.component_type == 2) {
                const buttonMsg = new BtnMessageComponent(client, data);
                client.emit('buttonClick', buttonMsg);
            }

            //Type 2 = button
            else if (data.data.component_type && data.data.component_type == 3) {
                const buttonMsg = new SelectMenuComponent(client, data);
                client.emit('menuSelect', buttonMsg);
            }
        });

    }

}