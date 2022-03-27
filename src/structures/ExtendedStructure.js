const { deepExtendInstance } = require('../util');

module.exports = class ExtendedStructure {

    constructor(client, originalStructure) {
        /** @type {import("../client/Client")} */
        this.client = client;
        if (originalStructure) deepExtendInstance(this, originalStructure);
    }

}