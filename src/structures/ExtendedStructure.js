
module.exports = class ExtendedStructure {

    constructor(client, originalStructure) {
        /** @type {import("../client/Client")} */
        this.client = client;

        if (originalStructure) {
            for (const key in originalStructure) {
                if (!(key in this)) this[key] = originalStructure[key];
            }

            for (const key in Object.getOwnPropertyDescriptors(Object.getPrototypeOf(originalStructure))) {
                const descriptor = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(originalStructure))[key];
                if (descriptor.value && typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(originalStructure);
                if (descriptor.get && typeof descriptor.get === 'function') descriptor.get = descriptor.get.bind(originalStructure);
                if (descriptor.set && typeof descriptor.set === 'function') descriptor.set = descriptor.set.bind(originalStructure);
                if (!(key in this)) Object.defineProperty(this, key, descriptor);
            }
        }
    }

}