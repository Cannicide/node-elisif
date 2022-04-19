const { extendedFunction } = require('../util');

/**
 * @callback IonOff
 * @param {String} removalEvent - When this event is triggered, the ion will be removed if ID conditions are met for removalEvent data.
 * @param {String} namespace - The namespace of the original ion event handler, i.e. the handler to remove.
 * @param {Function} callback - A callback function that will be called if and after the original ion event handler has been removed.
 */

/**
 * @callback IonAdd
 * @param {String} namespace - The namespace of the ion event handler to set the IDs of.
 * @param {...String} ids - The IDs to add for this namespace.
 */

/**
 * @callback IonRemove
 * @param {String} namespace - The namespace of the ion event handler to remove the IDs of.
 * @param {String[]} ids - A set of IDs to remove for this namespace.
 */

/**
 * @typedef {object} ION
 * @property {IonOff} off 
 * Removes the found set of a dynamic ion event handler's IDs when the specified removalEvent is called,
 * if all IDs specified by any single call of ion.add() for this namespace are found in the structure of the removalEvent data.
 * 
 * Removes only the IDs specified by ion.add() for this namespace that are found in the structure of the removalEvent data.
 * 
 * The purpose of this method is to deal with issues that arise in, for example, button/reaction handlers when their message is deleted.
 * This method provides a way to automatically remove an event handler when an associated event containing the same IDs is triggered.
 * @property {IonAdd} add
 * Sets the IDs that will trigger the ion() callback for a given namespace.
 * Adds onto any existing IDs set for this namespace.
 * 
 * IDs provided normally as a String, Number, or any other data type will be required to trigger the ion event.
 * However, you can use special syntax to make certain IDs linked to each other. Only one of such linked IDs are required to be present.
 * For example, if the IDs passed in are "a", "b", and ["c","d"], then the ion event will trigger if all of the following are true:
 * - id of "a" is present
 * - id of "b" is present
 * - id of "c" OR "d" is present
 * 
 * Any number of IDs can be linked to each other, and any number of IDs can be provided to this method.
 * IDs can be linked by passing in an array containing the IDs that are linked to each other, like so:
 * - In "a", "b", ["c","d"] -> "c" and "d" are linked
 * Alternatively, IDs can be linked by separating them with a double-colon in a single string, like so:
 * - In "a", "b", "c::d::e" -> "c", "d", and "e" are linked
 * @property {IonRemove} remove
 * Clears the IDs that will trigger the ion() callback for a given namespace.
 * Once cleared, the ion() callback will not be triggered (until ion.add() is called again for this namespace).
 */

/**
 * Creates a new dynamic "ION" event handler. ION events are dynamic event handlers that only trigger if specific IDs are found in event data.
 * Runs the specified callback if all IDs specified by ion.add() for this namespace are found in the structure of the event data.
 */
module.exports = class IonHandler {


    constructor(client, db) {
        this.client = client;
        this.db = db.table("elisifIon");
    }


    /**
     * Creates a new dynamic "ION" event handler. ION events are dynamic event handlers that only trigger if specific IDs are found in event data.
     * Runs the specified callback if all IDs specified by ion.add() for this namespace are found in the structure of the event data.
     * @param {String} event - The event to listen for and handle.
     * @param {String} namespace - A unique identifier representing the name and/or purpose of this specific handler.
     * @param {Function} callback - A callback function that will be called if the event is triggered, and if ID conditions are met.
     * @returns {ION} The ION event handler.
     */
    static asFunction(client, db) {
        const ion = new this(client, db);
        return extendedFunction(ion.on.bind(ion), {
            on: ion.on.bind(ion),
            off: ion.off.bind(ion),
            add: ion.add.bind(ion),
            remove: ion.remove.bind(ion),
            getIDs: ion.getIDs.bind(ion)
        });
    }

    /**
     * Creates a new dynamic event ("ion"). Hooks are dynamic event handlers that only trigger if specific IDs are found in event data.
     * Runs the specified callback if all IDs specified by ion#add() for this namespace are found in the structure of the event data.
     * @param {String} event - The event to listen for and handle.
     * @param {String} namespace - A unique identifier representing the name and/or purpose of this specific handler.
     * @param {Function} callback - A callback function that will be called if the event is triggered, and if ID conditions are met.
     */
    on(event, namespace, callback) {
        this.client.on(event, this.run.bind(this, true, namespace, callback));
    }

    /**
     * Removes a dynamic event ("ion") when the specified removalEvent is called,
     * if all IDs specified by ion#add() for this namespace are found in the structure of the removalEvent data.
     * 
     * Clears all IDs specified by ion#add() for this namespace and prevents further triggers of the ion#on() callback,
     * until more IDs are added by ion#add() for this namespace.
     * 
     * The purpose of this method is to deal with issues that arise in, for example, button/reaction handlers when their message is deleted.
     * This method provides a way to automatically remove an event handler when an associated event containing the same IDs is triggered.
     * @param {String} removalEvent - When this event is triggered, the ion will be removed if ID conditions are met for removalEvent data.
     * @param {String} namespace - The namespace of the original ion event handler, i.e. the handler to remove.
     * @param {Function} callback - A callback function that will be called if and after the original ion event handler has been removed.
     */
    off(removalEvent, namespace, callback) {
        this.client.on(removalEvent, this.run.bind(this, false, namespace, (...args) => {
            this.remove(namespace, args[args.length - 1]?.[1]);
            callback(...args.slice(0, args.length - 1), args[args.length - 1]?.[0]);
        }));
    }

    /**
     * Sets the IDs that will trigger the ion#on() callback for a given namespace.
     * Overrides any existing IDs set for this namespace.
     * 
     * IDs provided normally as a String, Number, or any other data type will be required to trigger the event ion.
     * However, you can use special syntax to make certain IDs linked to each other. Only one of such linked IDs are required to be present.
     * For example, if the IDs passed in are "a", "b", and ["c","d"], then the ion will trigger if all of the following are true:
     * - id of "a" is present
     * - id of "b" is present
     * - id of "c" OR "d" is present
     * 
     * Any number of IDs can be linked to each other, and any number of IDs can be provided to this method.
     * IDs can be linked by passing in an array containing the IDs that are linked to each other, like so:
     * - In "a", "b", ["c","d"] -> "c" and "d" are linked
     * Alternatively, IDs can be linked by separating them with a double-colon in a single string, like so:
     * - In "a", "b", "c::d::e" -> "c", "d", and "e" are linked
     * 
     * @param {String} namespace - The namespace of the ion event handler to set the IDs of.
     * @param {...String} ids - The IDs to add for this namespace.
     */
    async add(namespace, ...ids) {
        namespace = namespace.replace(/\./g, "_");
        
        let currentIds = await this.db.get(namespace) ?? {};
        let newIds = ids.map(id => Array.isArray(id) ? id.join("::") : id).join(",");
        if (!Object.keys(currentIds).some(idSet => idSet == newIds)) currentIds[newIds] = newIds;

        await this.db.set(namespace, currentIds);
        this.client.debug(`Added ion handler for <${namespace}>`);
    }

    /**
     * Clears the IDs that will trigger the ion#on() callback for a given namespace.
     * Once cleared, the ion#on() callback will not be triggered (until ion#add() is called again for this namespace).
     * @param {String} namespace - The namespace of the ion event handler to remove the IDs of.
     * @param {String[]} ids - A set of IDs to remove for this namespace.
     */
    async remove(namespace, ...ids) {
        namespace = namespace.replace(/\./g, "_");

        for (let id of ids) {
            if (!id) continue;
            const n = await this.db.get(namespace);
            delete n[id];
            await this.db.set(namespace, n);
        }

        this.client.debug(`Removed ion handler for <${namespace}>`);
    }

    /**
     * Runs the specified callback if all IDs specified by ion#add() for this namespace are found in the structure of the event data.
     * This method is designed for internal use by ion#on() and ion#off(), though it could potentially be used or overridden by other code.
     * @private
     * @param {Boolean} triggerLogs - Whether or not to trigger the debug logs for this method. True for ion#on() and false for ion#off().
     * @param {String} namespace - The namespace of the ion event handler, whose IDs will be searched for in the event data.
     * @param {Function} callback - The callback to run if ID conditions are met.
     * @param {...*} args - The arguments passed to the callback, representing the event data.
     */
    async run(triggerLogs, namespace, callback, ...args) {
        const ids = await this.getIDs(namespace);
        if (!ids) return;

        let idsFound = this.findIDs(ids, ...args);
        if (!idsFound) return;

        let [ foundIds ] = idsFound;

        if (triggerLogs) this.client.debug(`Running ion handler for <${namespace}>...`);
        callback(...args, namespace, triggerLogs ? foundIds : idsFound);
    }

    /**
     * Gets the IDs that will trigger the ion#on() callback for a given namespace.
     * Used mostly internally by ion#run().
     * @private
     * @param {String} namespace - The namespace of the ion event handler to get the IDs of.
     * @returns {String[]|null} An array of any number of IDs linked to the ion#on() callback's event data for this namespace.
     */
    async getIDs(namespace) {
        namespace = namespace.replace(/\./g, "_");

        let ion = await this.db.get(namespace);
        if (!ion) return null;
        
        return Object.keys(ion).map(idSet => idSet.split(","));
    }

    /**
     * Finds whether the provided IDs exist anywhere within the provided arguments.
     * Used mostly internally by ion#run().
     * @private
     * @param {String[]} idSets - The sets of IDs to search for in the event data.
     * @param {...*} args - The arguments passed to the callback, representing the event data.
     */
    findIDs(idSets, ...args) {
        let foundIds = null;
        let foundIdSet = null

        for (let ids of idSets) {
            let idsFound = 0;
            let allIds = [];

            ids.forEach(id => {
                if (id.match("::")) allIds = allIds.concat(id.split("::"));
                else allIds.push(id);
            });

            allIds.forEach(id => {
                let reg = new RegExp(`".*[iI][d]":("|)${id}("|)`, "gm");
                let found = args.map(arg => JSON.stringify(arg)).some(arg => arg.match(reg));
                if (found) idsFound++;
            });

            if (idsFound == ids.length) {
                foundIds = allIds;
                foundIdSet = ids.join(",");
                break;
            }
        }

        return foundIds ? [foundIds, foundIdSet] : null;
    }

}