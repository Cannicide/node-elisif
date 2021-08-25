// @ts-check

class SelectManager {

    constructor(message, msgutil) {
        this.message = message;
        this.util = msgutil.util;
        this.msgutil = msgutil;
    }

    has() {
        return this.msgutil.hasComponents() && this.message.components.find(v => v.components.find(c => c.type == "SELECT_MENU"));
    }

    /**
     * Get a select menu using index; all indexes are zero-based (they start at zero).
     * @param {Number|{customId:String}} [row] - Represents one of: sel index, or object with sel id specified. If unspecified, gets all sels in the message.
     * @returns SelectUtility | SelectUtility[] | false
     */
    get(row) {

        //Check if message has select menus:
        if (!this.has()) return false;

        /*
            4 modes of getting sel(s):
                1) (index) - using index to get a single, specific sel menu
                2) ({customId:"custom id here"}) - using a sel menu's custom id to get that specific sel menu
                3) () - getting all sel menus on the message in an array of SelectMenuComponents
        */
        var mode = 0;

        if (row != undefined && typeof row === "number") mode = 1;
        else if (row && typeof row === "object" && row.customId) mode = 2;
        else mode = 3;

        
        if (mode == 1) {

            //@ts-ignore
            var seldata = this.message.components.flatMap(rowset => rowset.components)[row];
            return this.util.Component(seldata, this.message);

        }
        else if (mode == 2) {

            //@ts-ignore
            var seldata = this.message.components.flatMap(rowset => rowset.components).find(c => c.customId == row.customId);
            return this.util.Component(seldata, this.message);

        }
        else {

            var menus = this.message.components.flatMap(rowset => rowset.components).filter(c => c.type == "SELECT_MENU").map(sel => this.util.Component(sel, this.message));
            return menus;

        }

    }

    add(selArr) {
        var components = this.message.components;

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
        return this.message.edit({ components });

    }

    remove(index) {
        var menu = this.get(index);
        if (!menu) return false;

        var components = this.message.components;

        if (components[menu.row - 1].components.length <= 1) components.splice(menu.row - 1, 1);
        else components[menu.row - 1].components.splice(menu.rowIndex, 1);

        return this.message.edit({ components });

    }

    edit(index, newProperties) {
        var menu = this.get(index);
        if (!menu) return false;

        var components = this.message.components;

        Object.assign(components[menu.row].components[menu.rowIndex], newProperties);

        return this.message.edit({ components });
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
         * @param {Number|import("../util/ComponentUtility").SelectUtility} index - Represents either the index of the select menu, or a Select Menu object.
         * @param {Object} option - A single option to add to the select menu.
         * @param {String} option.label - Label for this selectable option.
         * @param {String} [option.value] - Optional hidden value for this selectable option, for your dev purposes. Defaults to the label.
         * @param {String} [option.description] - Optional description for this selectable option. No description by default.
         * @param {String} [option.emoji] - Optional emoji for this selectable option. No emoji by default.
         * @param {String} [option.default] - Whether or not this selectable option is selected by default.
         */
        add(index, option) {
            //@ts-ignore
            var menu = this.menu.get(index);

            var options = menu.asComponent().options;
            options.push(option);

            return this.menu.edit(index, {options});
        },

        /**
         * Removes an option from the specified select menu.
         * @param {Number|import("../util/ComponentUtility").SelectUtility} index - Represents either the index of the select menu, or a Select Menu object.
         * @param {String} value - The value property, of the option to be removed.
         */
        remove(index, value) {
            //@ts-ignore
            var menu = this.menu.get(index);

            var options = menu.asComponent().options;
            if (options.length == 1) throw new Error("SelectManager.options#remove() - Cannot remove the only option of a select menu.");

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

module.exports = SelectManager;