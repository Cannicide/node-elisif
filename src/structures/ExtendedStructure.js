const { deepExtendInstance } = require('../util');
const getId = (structureOrId) => ["string", "number"].includes(typeof structureOrId) ? structureOrId : structureOrId.id;

module.exports = class ExtendedStructure {

    #originalStructure;
    constructor(client, originalStructure) {
        /** @type {import("../client/Client")} */
        this.client = client;
        if (originalStructure) deepExtendInstance(this, originalStructure);
        this.#originalStructure = originalStructure;
    }

    is(otherStructure) {
        return this.#originalStructure.id === getId(otherStructure);
    }

}