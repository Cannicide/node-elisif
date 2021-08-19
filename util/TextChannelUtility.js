// @ts-check

const StructureUtility = require("./StructureUtility");

class TextChannelUtility extends StructureUtility {

    /**
     * @param {import("./Utility")} util
     */
    constructor(channel, util, message = null) {

        super(channel, util);
        this.guild = channel.guild;
        this.channel = channel;
        this.lastMessage = message;

        //Add this utility object to the map, mapped with the message ID
        this.set();

    }

    get commands() {
        return this.client.commands.getUsableInChannel(this.channel);
    }

    /**
     * Creates and sends the defined embed(s) to the provided channel.
     * One of message or channel MUST be specified; if neither is specified, an error is thrown.
     * @param {Object[]|String|Set} embeds - An array of embeds to send OR String content of the message OR a ContentSupplier/ContentSupplier[] containing message content data.
     * @param {import("discord.js").Message} [message] - The optional message from which to set some default options, such as username in footer.
     */
    embed(embeds, message = this.lastMessage) {
        return this.elisif.interface.embed(embeds, message, this.channel);
    }

    /**
     * Sends a chainable interface to receive message input from users.
     * @param {*} question - The question or prompt to send to users for their input.
     * @returns {Promise<{r:Set, q:import("discord.js").Message, reply:(question:String) => Promise}>}
     */
    simpleTextMenu(question, message = this.lastMessage) {
        return new Promise((resolve, reject) => {
            this.elisif.interface.textMenu({message, question}).then(({responses:r, question:q}) => {
                // @ts-ignore
                resolve({r,q,reply:this.util.bindNth(this, this.simpleTextMenu, message)});
            }).catch(reject);
        });
    }

    /**
     * Sends a chainable interface to receive reaction input from users.
     * @param {*} question - The question or prompt to send to users for their input.
     * @param {*} reactions - The specific reactions to look for.
     * @param {*} time - The amount of time to keep the interface open.
     * @param {*} allUsers - Whether or not to receive input from all users, or just from the message author.
     * @returns {Promise<{r:import("discord.js").MessageReaction, m:import("discord.js").Message, reply:(question:String, reactions:String[]) => Promise}>}
     */
    simpleReactMenu(question, reactions, time, allUsers, message = this.lastMessage) {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            this.elisif.interface.reactMenu({message, question, reactions}).manyThen((m, r) => {
                resolve({m:m,r:r,reply:this.util.bindNth(this, this.simpleReactMenu, message, time, allUsers)});
            }, time, allUsers).manyCatch(reject);
        });
    }

    /**
     * Creates a new Pagination menu, a reaction collector that cycles through pages on user reaction
     * @param {Object} options - Options to construct the Embed object to paginate.
     * @param {Object[]} elements - Array of fields to cycle through when paginating
     * @param {String} elements[].name - Field title
     * @param {String} elements[].value - Field content
     * @param {Number} perPage - Number of elements per page
     */
    paginate(options, elements, perPage, message = this.lastMessage) {
        let embed = this.elisif.interface.createEmbed(options, message);
        return this.elisif.interface.reactionPaginator({message, embed, elements, perPage});
    }

    /**
     * Sends a message with one or more buttons attached.
     * @param {Object} embedOptions - Options for the message itself. Uses the same options as ChannelUtility#embed().
     * @param {Object[]} btnArr - An array of options for multiple buttons, or options for a single button.
     * @param {String} [btnArr[].color] - Optional color of the button. Defaults to blue.
     * @param {String} [btnArr[].emoji] - Optional emoji of the button. There is no emoji by default.
     * @param {String} [btnArr[].label] - Label of the button. Label becomes "[No label set]" if unspecified.
     * @param {boolean} [btnArr[].disabled] - Whether or not the button is disabled. Defaults to false.
     * @param {String} [btnArr[].url] - The optional URL this button leads to. Using this property overrides color and ID.
     * @param {String} [btnArr[].id] - The optional custom ID of this button. If unspecified, Elisif generates an unique ID for you.
     * @param {Number} [btnArr[].row] - The optional row of buttons & menus, or "action row", to add this button to. If unspecified, Elisif will select the next available row.
     */
    async button(embedOptions, btnArr, message) {

        let embed = this.elisif.interface.genEmbeds(embedOptions, message);

        var components = [];
        this.util.Button.prevRow = 1;

        var compArr = Array.isArray(btnArr) ? btnArr.map(v => this.util.Button.genComponent(v)) : [this.util.Button.genComponent(btnArr)];
        
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
            
            components[row].components.push(component.data.toJSON());
            
        });
        
        components = components.filter(co => co);
        // @ts-ignore
        embed.components = components;

        let msg = await this.channel.send(embed);
        return this.util.message(msg);
    }

    /**
     * Sends a message with one or more select menus attached.
     * @param {Object} embedOptions - Options for the message itself. Uses the same options as ChannelUtility#embed().
     * @param {Object[]} selArr - An array of options for multiple select menus, or options for a single select menu.
     * @param {String} [selArr[].placeholder] - Optional placeholder text of the select menu.
     * @param {Number} [selArr[].min] - Optional minimum number of options to be selected. Defaults to 1.
     * @param {Number} [selArr[].max] - Optional maximum number of options to be selected. Defaults to 1.
     * @param {Object[]} selArr[].options - The selectable options for this select menu.
     * @param {String} selArr[].options[].label - Label for this selectable option.
     * @param {String} selArr[].options[].value - Optional hidden value for this selectable option, for your dev purposes. Defaults to the label.
     * @param {String} selArr[].options[].description - Optional description for this selectable option. No description by default.
     * @param {String} selArr[].options[].emoji - Optional emoji for this selectable option. No emoji by default.
     * @param {boolean} selArr[].options[].default - Whether or not this selectable option is selected by default.
     * @param {String} [selArr[].id] - The optional custom ID of this select menu. If unspecified, Elisif generates an unique ID for you.
     * @param {Number} [selArr[].row] - The optional row of buttons & menus, or "action row", to add this select menu to. If unspecified, Elisif will select the next available row.
     */
    async selectMenu(embedOptions, selArr, message) {

        let embed = this.elisif.interface.genEmbeds(embedOptions, message);

        var components = [];
        this.util.SelectMenu.prevRow = components.length + 1;
        if (this.util.SelectMenu.prevRow >= 6) throw new Error("SelectManager#add() - A single message cannot have more than 5 rows of select menus.");

        var compArr = Array.isArray(selArr) ? selArr.map(v => this.util.SelectMenu.genComponent(v)) : [this.util.SelectMenu.genComponent(selArr)];
        
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
            
            components[row].components.push(component.data.toJSON());
            
        });
        
        components = components.filter(co => co);
        // @ts-ignore
        embed.components = components;

        let msg = await this.channel.send(embed);
        return this.util.message(msg);
    }

}

module.exports = TextChannelUtility;