const { SelectUtility } = require('../util/ComponentUtility');
const SelectMenuComponent = require('../structures/SelectMenuComponent');

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

        SelectUtility.prevRow = components.length + 1;

        if (SelectUtility.prevRow >= 6) throw new Error("message.menus#add() - A single message cannot have more than 5 rows of select menus.");

        var compArr = Array.isArray(selArr) ? selArr.map(v => SelectUtility.genComponent(v)) : [SelectUtility.genComponent(selArr)];
        
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

module.exports = SelectMenuManager;