const CacheManager = require('./CacheManager');
const { BaseMessageComponent, MessageActionRow } = require('discord.js');

module.exports = class ComponentManager extends CacheManager {

    #m;
    constructor(baseMessage) {
        super((() => {
            const comps = baseMessage.components.map((r, row) => r.components.map((c, col) => {
                c.col = col;
                c.row = row;
                return c;
            })).flat();

            return comps.map(c => [c.customId, c]);
        })(), BaseMessageComponent);
        this.#m = baseMessage;
    }

    /**
     * Gets all components in the specified row.
     * @param {Number} row - The index of the action row to retrieve the components of.
     * @returns {import('../util').Emap} Emap<String, Component>
     */
    getRow(row) {
        return this.filter(c => c.row === row).sort((a, b) => a.col - b.col);
    }

    /**
     * Gets all components in the specified column.
     * @param {Number} col - The index of the column to retrieve the components of.
     * @returns {import('../util').Emap} Emap<String, Component>
     */
    getColumn(col) {
        return this.filter(c => c.col === col).sort((a, b) => a.row - b.row);
    }

    /**
     * Gets the row-column coordinates of the component with the specified ID.
     * @param {String} id - The customId of the component.
     * @returns {[Number, Number]} Array[row: Number, col: Number]
     */
    cellOf(id) {
        const component = this.get(id);
        return [component.row, component.col];
    }

    /**
     * Gets a component by its ID, properties, or row-column coordinates.
     * @param {String|Object|Number} optsOrRow - The string customId, object properties, or number row of the component.
     * @param {Number} [col] - The number column of the component. Required if a row was specified, optional otherwise.
     * @returns Component
     */
    get(optsOrRow, col = undefined) {
        if (col !== undefined && typeof optsOrRow !== "string") return this.getRow(optsOrRow)[col]; // Handle get by row and col
        return super.get(optsOrRow); // Handle get by ID or opts
    }

    /**
     * Adds a component to the message. The message is edited with the added component.
     * @param {ComponentResolvable} component - The component to add to the message.
     * @param {Number} [row] - The optional row to add the component to. If unspecified, the last available row is used (or a new one is created, if necessary).
     * @returns {Promise<import('discord.js').Message>} Discord.js Message
     */
    add(component, row = null) {
        if (Array.isArray(component)) component = new MessageActionRow().addComponents(...component);
        if (component instanceof MessageActionRow) {
            // Handle adding an action row
            this.#m.components.push(component);
            if (component.components.length) return this.#m.edit({ components: this.#m.components });
            return null;
        }

        let initialRow = row ?? this.#m.components.length - 1;
        if (initialRow < 0) initialRow = 0;
        if (initialRow == this.#m.components.length) this.#m.components.push(new MessageActionRow());
        const rowWidth = this.#m.components[initialRow].components.reduce((sum, c) => sum + ComponentManager.widthOf(c.type), 0);

        if (rowWidth + ComponentManager.widthOf(component.type) > ComponentManager.maxRowWidth) {
            if (row !== undefined) throw new Error("Cannot add component to row " + row + " because it would exceed the maximum row width of " + ComponentManager.maxRowWidth + ".");
            // Automatically recursively add the component to the next available row:
            return this.add(component, initialRow + 1);
        }

        this.#m.components[initialRow].components.push(component);
        return this.#m.edit({ components: this.#m.components });
    }

    /**
     * Sets a component in the message. The message is edited with the updated/added component.
     * (This method can also be used to update the component cache, but that option is only used internally and is not documented here).
     * @param {ComponentResolvable} component - The component to set in the message.
     * @param {Number} row - The row of the component to set in the message.
     * @param {Number} [col] - The optional column of the component to set in the message. If unspecified, the entire row will be set.
     * @returns {Promise<import('discord.js').Message>} Discord.js Message
     */
    set(component /* or ID */, row /* or value */, col = undefined) {
        if (!component || row === undefined) return null;
        if (typeof component === "string") return super.set(component, row); // Handle set by ID

        if (!this.#m.components[row]) this.#m.components[row] = new MessageActionRow();

        if (col === undefined) {
            if (component.type === "ACTION_ROW") {
                // Handle setting an entire action row:

                this.#m.components[row] = component;
                return this.#m.edit({ components: this.#m.components });
            }
            
            // Handle setting a component by only row:

            this.#m.components[row] = new MessageActionRow().addComponents(component);
            return this.#m.edit({ components: this.#m.components });
        }

        // Handle setting a component by row and column:

        this.#m.components[row].components[col] = component;
        return this.#m.edit({ components: this.#m.components });
    }

    /**
     * Deletes a component from the message and cache. The message is edited to remove the deleted component.
     * @param {String|Number} idOrRow - The string customId or number row of the component to delete.
     * @param {Number} [col] - The number column of the component to delete. Required if a row was specified, optional otherwise. 
     * @param {ComponentResolvable} [replacement] - An optional new component to replace the deleted component with.
     * @returns {Promise<import('discord.js').Message>} Discord.js Message
     */
    delete(idOrRow, col = null, replacement = null) {
        if (typeof idOrRow === "string") {
            // Handle deleting components by ID:

            const [ delRow, delCol ] = this.cellOf(idOrRow);
            super.delete(idOrRow);
            
            idOrRow = delRow;
            col = delCol;
        }

        if (col === null) {
            // Handle deleting component rows:

            this.#m.components[idOrRow].components.forEach(c => super.delete(c.customId));
            this.#m.components.splice(idOrRow, 1);
            return this.#m.edit({ components: this.#m.components });
        }

        // Handle deleting components by row and column:

        if (!replacement) this.#m.components[idOrRow].spliceComponents(col, 1);
        else this.#m.components[idOrRow].components[col] = replacement;

        // Handle removing empty action rows
        this.#m.components = this.#m.components.filter(actionRow => actionRow.components.length);

        return this.#m.edit({ components: this.#m.components });
    }

    /**
     * Edits a component in the message and cache. The message is edited to modify the component.
     * @param {String} id - The string customId of the component to edit.
     * @param {(ComponentResolvable) => void} mapCallback - A callback function, with the component as the sole parameter, that can directly modify the component.
     * @returns {Promise<import('discord.js').Message>} Discord.js Message
     */
    edit(id, mapCallback = (component) => null) {
        const component = this.get(id);
        if (!component) return null;

        mapCallback(component);

        const [row, col] = this.cellOf(id);
        if (row === undefined || col === undefined) return null;

        this.set(id, component);
        return this.set(component, row, col);
    }

    /**
     * Filters and returns only components of the specified type.
     * @param {"BUTTON"|"SELECT_MENU"} componentType 
     * @returns {import('../util').Emap} Emap<String, Component>
     */
    ofType(componentType) {
        return this.filter(c => c.type === componentType).sort((a, b) => a.col - b.col).sort((a, b) => a.row - b.row);
    }

    /**
     * Determines the standard width (number of columns occupied) of a component.
     * @param {*} componentType
     */
    static widthOf(componentType) {
        if (componentType === "BUTTON") return 1;
        if (componentType === "SELECT_MENU") return 5;
        if (componentType === "MODAL") return 0;
        return -1;
    }

    /** The max width of a message action row. */
    static maxRowWidth = 5;

}