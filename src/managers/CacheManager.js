
const { Emap } = require('../util');

module.exports = class CacheManager extends Emap {

    constructor(cache, type, manager) {
        super(cache);
        Object.defineProperty(this, 'type', { value: type });
        if (manager) for (const key in manager) if (!(key in this)) Object.defineProperty(this, key, { value: manager[key] });
    }

    /**
     * Resolves a data entry to a data Object.
     * @param {string|Object} idOrInstance - The id, instance, custom id, or name of something in this Manager
     * @returns {?Object} An instance from this Manager
     */
    resolve(idOrInstance) {
        if (idOrInstance instanceof this.type) return idOrInstance;
        if (typeof idOrInstance === 'string') return this.get(idOrInstance) ?? this.get({ customId: idOrInstance }) ?? this.get({ name: idOrInstance }) ?? null;
        return this.get(idOrInstance) ?? null;
    }

    /**
     * Resolves a data entry to an instance id.
     * @param {string|Object} idOrInstance - The id, instance, custom id, or name of something in this Manager
     * @returns {?String} The id of the provided data entry
     */
    resolveId(idOrInstance) {
        if (idOrInstance instanceof this.type) return idOrInstance.id;
        if (typeof idOrInstance === 'string' && !isNaN(idOrInstance) && idOrInstance.length == 18) return idOrInstance;
        return this.resolve(idOrInstance)?.id ?? null;
    }

}