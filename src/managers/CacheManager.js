
const { Emap, deepExtendInstance } = require('../util');

class NullType {
    id = null;
}

module.exports = class CacheManager extends Emap {

    constructor(cache, type = NullType, manager) {
        super(cache);
        Object.defineProperty(this, 'cacheType', { value: type });
        if (manager) deepExtendInstance(this, manager);
    }

    /**
     * Resolves a data entry to a data Object.
     * @param {string|Object} idOrInstance - The id, instance, custom id, or name of something in this Manager
     * @returns {?Object} An instance from this Manager
     */
    resolve(idOrInstance) {
        if (idOrInstance instanceof this.cacheType) return idOrInstance;
        if (typeof idOrInstance === 'string') return this.get(idOrInstance) ?? this.get({ customId: idOrInstance }) ?? this.get({ name: idOrInstance }) ?? null;
        return this.get(idOrInstance) ?? null;
    }

    /**
     * Resolves a data entry to an instance id.
     * @param {string|Object} idOrInstance - The id, instance, custom id, or name of something in this Manager
     * @returns {?String} The id of the provided data entry
     */
    resolveId(idOrInstance) {
        if (idOrInstance instanceof this.cacheType) return idOrInstance.id;
        if (typeof idOrInstance === 'string' && !isNaN(idOrInstance) && idOrInstance.length == 18) return idOrInstance;
        return this.resolve(idOrInstance)?.id ?? null;
    }

}