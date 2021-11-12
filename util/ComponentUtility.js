//@ts-check

// @ts-ignore
const { MessageButton, MessageSelectMenu } = require("discord.js");

class ComponentUtility {

    constructor(component, util, message) {
        this._data = component.component;
        this._int = component;
        this.message = message ?? this._int.message;
        this.util = util;
    }

    static COMPONENT_TYPE = [
        "UNKNOWN",
        "UNKNOWN",
        "BUTTON",
        "SELECT_MENU"
    ]

    static fromInteraction(compInteraction, util, message) {

        if (!compInteraction) return undefined;

        let comp = compInteraction.component;
        if (!comp && compInteraction.customId) compInteraction = {component:compInteraction, componentType: compInteraction.type};

        if (compInteraction.componentType == "SELECT_MENU") return new SelectUtility(compInteraction, util, message);
        else if (compInteraction.componentType == "BUTTON") return new ButtonUtility(compInteraction, util, message);
        return undefined;
    }

    get index() {
      
        var index = 0;
        var comp;
          
        this.message.components.forEach(row => {
  
          var newcomp = row.components.findIndex(c => c.customId && c.customId == this._data.customId);
          
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
  
        var rowindex = this.message.components.findIndex(row => {
  
          return row.components.find(c => c.customId && c.customId == this._data.customId);
  
        });
        
        return rowindex <= -1 ? false : rowindex;
        
    }
    
    //Index within row, relative to the start of the row
    get rowIndex() {
    
        var row = this.row;
        
        if (row === false) return false;
        
        var rowindex = this.message.components[row].components.findIndex(c => c.customId && c.customId == this._data.customId);
        
        return rowindex <= -1 ? false : rowindex;
    
    }

    asComponent() {
        return this._data;
    }

}

class ButtonUtility extends ComponentUtility {

    static get db() {
        let evg = require("../index").evg;
        return evg.dynamic("utility");
    }

    static get id() {
        var tab = ButtonUtility.db.table("extendables");
        if (!tab.has("component_id")) tab.set("component_id", 1000000);

        var current = tab.get("component_id");
        tab.add("component_id", 1);

        return current;
    }

    static genID() {
        var id = "ELISIFBTN" + (ButtonUtility.id);
        return id;
    }

    static colorValues = {
        "blue": "PRIMARY",
        "blurple": "PRIMARY",
        "primary": "PRIMARY",
        "gray": "SECONDARY",
        "grey": "SECONDARY",
        "secondary": "SECONDARY",
        "green": "SUCCESS",
        "success": "SUCCESS",
        "red": "DANGER",
        "danger": "DANGER",
        "failure": "DANGER",
        "link": "LINK",
        "url": "LINK"
    }

    static enumToColor = {
        "PRIMARY": "blue",
        "SECONDARY": "gray",
        "SUCCESS": "green",
        "DANGER": "red",
        "URL": "url"
    }

    static convertColor(color) {
        
        return ButtonUtility.colorValues[color.toLowerCase()];
    }

    static deconvertColor(num) {

        return ButtonUtility.enumToColor[num];

    }

    static prevRow = 1

    static genComponent({
        color = "blue",
        emoji = "",
        label = "[No label set]",
        disabled = false,
        url = null,
        id = null,
        row = null
    }) {
        
        let data = new MessageButton()

        if (url) {
            color = "url";
            id = undefined;
            data = data.setURL(url);
        }
        else {
            if (!id) {
                id = ButtonUtility.genID();
            }
            
            url = undefined;
        }
        
        if (label.length > 80) label = "[Label too large]";
        if (!row) row = Math.floor(ButtonUtility.prevRow += 0.2);

        data = data
        .setStyle(ButtonUtility.convertColor(color))
        .setLabel(label)
        .setEmoji(emoji)
        .setCustomId(id)
        .setDisabled(disabled);
        
        var component = {
            data,
            row: row - 1
        };
        
        return component;
    
    }

    get manager() {
        return this.util.Message(this.message).buttons;
    }

    get disabled() {
        return this._data.disabled;
    }

    get label() {
        return this._data.label;
    }

    get customId() {
        return this._data.customId;
    }

    get color() {
        var comp = this._data;
        if (!comp) return undefined;
        
        return ButtonUtility.deconvertColor(comp.style);
    }

    enable() {
        var { row, rowIndex, manager } = this;
        return manager.enable(row, rowIndex);
    }

    disable() {
        var { row, rowIndex, manager } = this;
        return manager.disable(row, rowIndex);
    }

    permDisable() {
        var { row, rowIndex, manager } = this;
        return manager.permDisable(row, rowIndex);
    }

    toggleDisabled(timeout = undefined) {
        var { row, rowIndex, manager } = this;
        return manager.toggleDisabled(row, rowIndex, timeout);
    }

    setColor(color) {

        var { row, rowIndex, manager } = this;
        return manager.setColor(row, rowIndex, color);

    }

    setLabel(label) {

        var { row, rowIndex, manager } = this;
        return manager.setLabel(row, rowIndex, label);

    }

};

class SelectUtility extends ComponentUtility {

    static genID() {
        var id = "ELISIFSEL" + (ButtonUtility.id);
        return id;
    }

    static prevRow = 1;

    static genComponent({
        placeholder = "Select an option...",
        min = 1,
        max = 1,
        options = [
            {
                label: "[No label set]",
                value: "none",
                description: "No options were specified for this Select Menu.",
                emoji: "",
                default: true
            }
        ],
        id = null,
        row = null
    }) {
        
        if (!id) {
            id = SelectUtility.genID();
        }

        options.forEach(options => {
        
            if (!options.label) options.label = "[No label set]";
            else if (options.label.length > 25) options.label = "[Label too large]";

            if (!options.value) options.value = options.label;
            else if (options.value.length > 100) throw new Error("Select Menu Option value too large for: " + `${options.label}`);

        });
        
        if (!row) row = SelectUtility.prevRow++;
        
        var component = {
            data: new MessageSelectMenu()
                .setPlaceholder(placeholder)
                .setMaxValues(max)
                .setMinValues(min)
                .addOptions(options)
                .setCustomId(id),
            row: row - 1
        };
        
        return component;
    
    }

    //Index within row, relative to the start of the row; always 0 for select menus
    get rowIndex() { return 0 };

    get manager() {
        return this.util.Message(this.message).menus;
    }

    get customId() {
        return this._data.customId;
    }

    get max() {
        return this._data.maxValues;
    }

    get min() {
        return this._data.minValues;
    }

    getOptionByValue(value) {
        return this._data.options.find(option => option.value == value);
    }

    getOptionByLabel(label) {
        return this._data.options.find(option => option.label == label);
    }

    get selected() {
        return this._int.values;
    }

    setPlaceholder(placeholder) {
        var { row, manager } = this;
        return manager.setPlaceholder(row, placeholder);
    }

    setMin(min) {
        var { row, manager } = this;
        return manager.setMin(row, min);
    }

    setMax(max) {
        var { row, manager } = this;
        return manager.setMax(row, max);
    }

    options = {
        menu: this,
        /**
         * Adds an option to the specified select menu.
         * @param {Object} option - A single option to add to the select menu.
         * @param {String} option.label - Label for this selectable option.
         * @param {String} [option.value] - Optional hidden value for this selectable option, for your dev purposes. Defaults to the label.
         * @param {String} [option.description] - Optional description for this selectable option. No description by default.
         * @param {String} [option.emoji] - Optional emoji for this selectable option. No emoji by default.
         * @param {String} [option.default] - Whether or not this selectable option is selected by default.
         */
        add(option) {
            //@ts-ignore
            var { row, manager } = this.menu;
            return manager.options.add(row, option);
        },

        /**
         * Removes an option from the specified select menu.
         * @param {String} value - The value property, of the option to be removed.
         */
        remove(value) {
            //@ts-ignore
            var { row, manager } = this.menu;
            return manager.options.remove(row, value);

        },

        get(value) {
            var { row, manager } = this.menu;
            return manager.options.get(row, value);
        }
    }

}

module.exports = { ButtonUtility, SelectUtility, ComponentUtility };