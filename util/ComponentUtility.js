//@ts-check

// @ts-ignore
const { MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");

class ComponentUtility {

    constructor(component) {
        this._data = component;
    }

    static fromInteraction(compInteraction) {

        if (!compInteraction) return undefined;

        let comp = compInteraction.component;
        if (!comp && compInteraction.customId) comp = compInteraction;

        if (compInteraction.componentType == "SELECT_MENU") return new SelectUtility(comp);
        else if (compInteraction.componentType == "BUTTON") return new ButtonUtility(comp);
        return undefined;
    }

    get index() {
      
        var index = 0;
        var comp;
          
        this._data.message.components.forEach(row => {
  
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
  
        var rowindex = this._data.message.components.findIndex(row => {
  
          return row.components.find(c => c.customId && c.customId == this._data.customId);
  
        });
        
        return rowindex <= -1 ? false : rowindex + 1;
        
    }
    
    //Index within row, relative to the start of the row
    get rowIndex() {
    
        var row = this.row;
        
        if (!row) return false;
        
        var rowindex = this._data.message.components[row - 1].components.findIndex(c => c.customId && c.customId == this._data.customId);
        
        return rowindex <= -1 ? false : rowindex;
    
    }

    asComponent() {
        return this._data;
    }

}

class ButtonUtility extends ComponentUtility {

    constructor(button) {
        super(button);
    }

    static get db() {
        let evg = require("../index").evg;
        return evg.resolve("utility");
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
        
        if (url) {
            color = "url";
            id = undefined;
        }
        else {
            if (!id) {
                id = ButtonUtility.genID();
            }
            
            url = undefined;
        }
        
        if (label.length > 80) label = "[Label too large]";
        if (!row) row = Math.floor(ButtonUtility.prevRow += 0.2);
        
        var component = {
            data: new MessageButton()
                .setStyle(ButtonUtility.convertColor(color))
                .setLabel(label)
                .setURL(url)
                .setEmoji(emoji)
                .setCustomId(id)
                .setDisabled(disabled),
            row: row - 1
        };
        
        return component;
    
    }

    get color() {
        var comp = this._data;
        if (!comp) return undefined;
        
        return ButtonUtility.deconvertColor(comp.style);
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

}

module.exports = { ButtonUtility, SelectUtility, ComponentUtility };