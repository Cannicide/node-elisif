// An extension of the Discord.js GuildChannel and TextChannel classes

const { APIMessage } = require("discord.js");

// const ButtonUtility
// const SelectUtility
const { ButtonUtility, SelectUtility } = require("../util/ComponentUtility");

// class ThreadManager
const ThreadManager = require("../managers/ThreadManager");


function ExtendedChannel(ExtendableChannel) {
    //Advanced Channel
    class AdvancedChannel extends ExtendableChannel {

        advanced = true;

        constructor(guild, data) {

            super(guild, data);

            this.commands = this.client.commands.getUsableInChannel(this);

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
            var embed = new this.elisif.interface.Embed(this.lastMessage, options);
            return this.send(embed);
        }

        /**
         * Creates an interface to receive message input from users.
         * @param {*} question - The question or prompt to send to users for their input.
         * @returns Promise; (message, questionMessage) => {}
         */
        textInterface(question) {
            return new Promise((resolve, reject) => {
                new this.elisif.interface.Interface(this.lastMessage, question, (m, q) => {
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
                new this.elisif.interface.ReactionInterface(this.lastMessage, question, reactions, (m, r) => {
                    resolve({m:m,r:r,reply:this.reactionInterface.bind(this)});
                }, time, allUsers);
            });
        }

        /**
         * Returns a Message Interpreter.
         * @param {Object} options - All registration options for the message interpreter.
         * @param {Function} options.filter - A function that accepts (message, args) for messages/dms to check whether or not the input should be responded to.
         * @param {Function} options.response - A function that accepts (message, args) for messages/dms to respond to an interpreted input that passes the filter check.
         * @param {boolean} options.DMs - Whether or not this message interpreter should be a DM interpreter.
         */
        messageInterpreter({filter, response, DMs}) {
            return DMS ? this.elisif.interpreter.dms.register({filter, response}) : this.elisif.interpreter.messages.register({filter, response});
        }

        /**
         * Returns a Reaction Interpreter, containing various utility methods to interact with Reaction Interpreter data.
         * @param {Object} options
         * @param {(cachedReactionEntry:Object, reaction:MessageReaction, user:User) => boolean} options.filter - A function that returns true if the reaction should be interpreted.
         * @param {(reaction:MessageReaction,user:User) => void} options.response - A function that interprets/responds to the reaction if it passes the filter.
         * @param {String} options.category - The category of the reaction interpreter.
         * @param {boolean} [options.adding] - Whether to interpret when the reaction is added or removed. True by default.
         */
        reactionInterpreter({filter, response, category, adding}) {
            return this.elisif.interpreter.reactions.register({filter, response, category, adding});
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
            let embed = new this.elisif.interface.Embed(this.lastMessage, options);
            return new this.elisif.interface.Paginator(this.lastMessage, embed, elements, perPage);
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

            var embed = new this.elisif.interface.Embed(this.lastMessage, embedOptions);

            buttonUtilities.prevRow = 1;

            var compArr = Array.isArray(btnArr) ? btnArr.map(v => ButtonUtility.genComponent(v)) : [ButtonUtility.genComponent(btnArr)];
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

            var embed = new this.elisif.interface.Embed(this.lastMessage, embedOptions);

            selUtilities.prevRow = 1;

            var compArr = Array.isArray(selArr) ? selArr.map(v => SelectUtility.genComponent(v)) : [SelectUtility.genComponent(selArr)];
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

        get threads() {
            return new ThreadManager(this);
        }

        isExtended() {
            return true;
        }

        get client() {
            return this.elisif.Client ? this.elisif.Client.getInstance() : null;
        }

        get elisif() { return require("../index").getInstance(); }

    }

    return AdvancedChannel;
}

module.exports = ExtendedChannel;