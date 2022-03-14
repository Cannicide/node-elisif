
module.exports = class ExtendedStructure {

    constructor(client, originalStructure) {
        this.client = client;

        if (originalStructure) for (const key in originalStructure) {
            if (!(key in this)) this[key] = originalStructure[key];
        }
    }

}