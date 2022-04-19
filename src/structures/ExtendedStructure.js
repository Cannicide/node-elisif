const { deepExtendInstance } = require('../util');
const getId = (structureOrId) => ["string", "number"].includes(typeof structureOrId) ? structureOrId : structureOrId.id;

module.exports = class ExtendedStructure {

    #originalStructure;
    /** @private */
    __base;
    /** @private */
    __extended = true;
    constructor(client, originalStructure, customProperties) {
        /** @type {import("../client/Client")} */
        this.client = client;
        if (originalStructure) deepExtendInstance(this, originalStructure);
        if (customProperties) deepExtendInstance(this, customProperties);
        this.#originalStructure = originalStructure;
        this.__base = originalStructure;

        // Gives toJSON() access to the extended properties of the structure:
        if (this.__base.toJSON) this.toJSON = this.__base.toJSON.bind(this);
    }

    is(otherStructure) {
        return this.#originalStructure.id === getId(otherStructure);
    }

}