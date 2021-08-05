const { ButtonUtility } = require('../util/ComponentUtility');
const ButtonComponent = require('../structures/ButtonComponent');

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

            var button = new ButtonComponent(this.message.client, simdata);

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

            var button = new ButtonComponent(this.message.client, simdata);

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

            var button = new ButtonComponent(this.message.client, simdata);

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

                    var button = new ButtonComponent(this.message.client, simdata);
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
        ButtonUtility.prevRow = openRow < 0 ? (components.length < 5 ? components.length + 1 : 5) : (openRow + 1) + ((components[openRow].components.length - 1) * 0.2);

        if (ButtonUtility.prevRow >= 5.8) throw new Error("message.buttons#add() - A single message cannot have more than 5 rows of buttons.");

        var compArr = Array.isArray(btnArr) ? btnArr.map(v => ButtonUtility.genComponent(v)) : [ButtonUtility.genComponent(btnArr)];
        
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
        return this.edit(row, rowIndex, {disabled: true, style: ButtonUtility.convertColor("gray")});
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

        return this.edit(row, rowIndex, {style: ButtonUtility.convertColor(color)});

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

module.exports = ButtonManager;