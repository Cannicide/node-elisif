//@ts-check

class ButtonManager {

    constructor(message, msgutil) {
        this.message = message;
        this.util = msgutil.util;
        this.msgutil = msgutil;
    }

    has() {
        return this.msgutil.hasComponents() && this.message.components.find(v => v.components.find(c => c.type == "BUTTON"));
    }

    /**
     * 
     * @param {Number|{customId:String}} [row] - Represents one of: row number, button index, or object with button id specified. If unspecified, gets all buttons in the message.
     * @param {Number} [rowIndex] - The index, within and relative to the specified row, of the button to get.
     * @returns ButtonUtility | ButtonUtility[] | false
     */
    get(row, rowIndex) {

        //Check if message has buttons:
        if (!this.has()) return false;

        /*
            4 modes of getting button(s):
                1) (row, rowIndex) - using both row and index within row to get a single, specific button
                2) (index) - using simply index (out of all buttons across all rows) to get a single, specific button
                3) ({customId:"custom id here"}) - using a button's custom id to get that specific button
                4) () - getting all buttons on the message in an array of BtnMessageComponents
        */
        var mode = 4;

        if (row && rowIndex) mode = 1;
        else if (row != undefined && typeof row === "number") mode = 2;
        else if (row && typeof row === "object" && row.customId) mode = 3;

        if (mode == 1) {

            var rowset = this.getRow(row);
            if (!rowset) return false;

            return this.util.component(rowset[rowIndex]);

        }
        else if (mode == 2) {

            // @ts-ignore
            var buttondata = this.message.components.flatMap(rowset => rowset.components)[row];
            return this.util.component(buttondata);

        }
        else if (mode == 3) {

            // @ts-ignore
            var buttondata = this.message.components.flatMap(rowset => rowset.components).find(c => c.customId == row.customId);
            return this.util.component(buttondata);

        }
        else {

            var buttons = this.message.components.flatMap(rowset => rowset.components).filter(c => c.type == "BUTTON").map(btn => this.util.component(btn));
            return buttons;

        }

    }

    getRow(row) {

        var rowset = this.message.components[row - 1];
        return rowset?.components ?? false;

    }

    add(btnArr) {
        var components = this.message.components;

        var openRow = components.findIndex(v => v.components.length < 1 || (v.components.length < 5 && v.components.find(c => c.type == "BUTTON")));
        this.util.Button.prevRow = openRow < 0 ? (components.length < 5 ? components.length + 1 : 5) : (openRow + 1) + ((components[openRow].components.length - 1) * 0.2);

        if (this.util.Button.prevRow >= 5.8) throw new Error("ButtonManager#add() - A single message cannot have more than 5 rows of buttons.");

        var compArr = Array.isArray(btnArr) ? btnArr.map(v => this.util.Button.genComponent(v)) : [this.util.Button.genComponent(btnArr)];
        
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
            
            components[row].components.push(component.data.toJSON());
            
        });
        
        components = components.filter(co => co);
        this.message.components = components;

        return this.message.edit(this.message);

    }

    remove(row, rowIndex) {
        var button = this.get(row, rowIndex);
        if (!button) return false;

        var components = this.message.components;
        components[button.row - 1].components.splice(button.rowIndex, 1);

        if (components[button.row - 1].components.length <= 0) components.splice(button.row - 1, 1);
        this.message.components = components;

        return this.message.edit(this.message);
    }

    edit(row, rowIndex, newProperties) {
        var button = this.get(row, rowIndex);
        if (!button) return false;

        var components = this.message.components;
        Object.assign(components[button.row - 1].components[button.rowIndex], newProperties);
        this.message.components = components;

        return this.message.edit(this.message);
    }

    enable(row, rowIndex) {
        return this.edit(row, rowIndex, {disabled: false});
    }

    disable(row, rowIndex) {
        return this.edit(row, rowIndex, {disabled: true});
    }

    permDisable(row, rowIndex) {
        return this.edit(row, rowIndex, {disabled: true, style: this.util.Button.convertColor("gray")});
    }

    toggleDisabled(row, rowIndex, timeout = undefined) {
        var button = this.get(row, rowIndex);
        if (!button) return false;

        const disabled = button.asComponent().disabled;
        if (disabled == undefined) return false;

        const output = this.edit(row, rowIndex, {disabled: !disabled});

        if (timeout) setTimeout(() => {this.toggleDisabled(row, rowIndex, undefined)}, timeout);
        else return output;
    }

    setColor(row, rowIndex, color) {

        var button = this.get(row, rowIndex);
        if (!button) return false;

        var style = button.color;

        if (!style || !color || style == color) return false;
        if (style == "url") throw new Error("ButtonManager#setColor() - Cannot set color of a URL button.");
        if (this.util.Button.convertColor(color) == "LINK") throw new Error("ButtonManager#setColor() - Cannot set style of regular button to 'URL'.");

        return this.edit(row, rowIndex, {style: this.util.Button.convertColor(color)});

    }

    setLabel(row, rowIndex, label) {

        var button = this.get(row, rowIndex);
        if (!button) return false;

        var currLabel = button.asComponent().label;

        if (currLabel == label) return false;
        if (label == "" || !(typeof label === "string") || label.length > 80) throw new Error("ButtonManager#setLabel() - Invalid label specified; is empty, too long, or not a String.");

        return this.edit(row, rowIndex, {label});

    }

}

module.exports = ButtonManager;