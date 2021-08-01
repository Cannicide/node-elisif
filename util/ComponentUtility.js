const evg = require("../index").evg;

class ButtonUtility {

    static db = evg.resolve("utility");

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

    static resolveEmoji(emoji) {
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
    }

    static colorValues = {
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

    static numToColor = {
        1: "blue",
        2: "gray",
        3: "green",
        4: "red",
        5: "url"
    }

    static convertColor(color) {
        
        return ButtonUtility.colorValues[color.toLowerCase()];
    }

    static deconvertColor(num) {

        return ButtonUtility.numToColor[num];

    }

    static prevRow = 1

    static genComponent(options) {
        
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
            options.id = ButtonUtility.genID();
            }
            
            options.url = undefined;
        }
        
        if (!("label" in options) || !options.label) options.label = "[No label set]";
        else if (options.label.length > 80) options.label = "[Label too large]";
        
        if (!("row" in options) || !options.row) options.row = Math.floor(ButtonUtility.prevRow += 0.2);
        
        var component = {
            type: 2,
            style: ButtonUtility.convertColor(options.color),
            label: options.label,
            emoji: ButtonUtility.resolveEmoji(options.emoji),
            custom_id: options.id,
            url: options.url,
            disabled: options.disabled,
            row: options.row - 1
        };
        
        return component;
    
    }

};

class SelectUtility {

    static genID() {
        var id = "ELISIFSEL" + (ButtonUtility.id);
        return id;
    }

    static resolveEmoji(emoji) {
        return ButtonUtility.resolveEmoji(emoji);
    }

    static prevRow = 1;

    static genComponent(settings) {
        
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
            settings.id = SelectUtility.genID();
        }

        settings.options.forEach(options => {
        
            if (!("label" in options) || !options.label) options.label = "[No label set]";
            else if (options.label.length > 25) options.label = "[Label too large]";

            if (!("value" in options) || !options.value) options.value = options.label;
            else if (options.value.length > 100) throw new Error("Select Menu Option value too large for: " + `${options.label}`);

            if ("emoji" in options && options.emoji) options.emoji = SelectUtility.resolveEmoji(options.emoji);

        });
        
        if (!("row" in settings) || !settings.row) settings.row = SelectUtility.prevRow++;
        
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

module.exports = { ButtonUtility, SelectUtility };