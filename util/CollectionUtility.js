module.exports = {
    /**
     * An extended set with additional utility methods.
     * Can also be directly constructed from several values, an array of values, or a Set object.
    */
    ElisifSet: class ElisifSet extends Set {
        constructor(...values) {
            super();
            values.forEach(val => this.add(val));
        }

        toArray() {
            return [...this.values()];
        }

        map(func) {
            return this.toArray().map(func);
        }

        get(index) {
            return this.toArray()[index];
        }

        forEach(callback, thisArg) {
            //(value, key, map) => void
            return super.forEach((value, key) => {
                return callback.apply(thisArg, [value, key, this]);
            });
        }

        /**
         * Returns a new ElisifSet containing only items that satsify the provided filter function.
        */
        filter(func) {
            //(value, value2, set) => boolean
            
            let newSet = new ElisifSet();

            this.forEach((value, value2, set) => {
                if (func(value, value2, set)) newSet.add(value);
            });

            return newSet;
        }

        /**
         * Returns a new ElisifSet containing only items that do NOT satsify the provided filter function.
        */
        sweep(func) {
            //(value, value2, set) => boolean
        
            let newSet = new ElisifSet();

            this.forEach((value, value2, set) => {
                if (!func(value, value2, set)) newSet.add(value);
            });

            return newSet;
        }

        /**
         * Partitions and returns an array of two new ElisifSets.
         * The first contains items that passed the filter, and the second contains items that failed the filter.
        */
        partition(func) {
            //(value, key, map) => boolean
            let trueSet = this.filter(func);
            let falseSet = this.sweep(func);

            return [ElisifSet.from(trueSet), ElisifSet.from(falseSet)];
        }

        static from(set) {
            var result;
            if (set instanceof Set) result = new ElisifSet(...set.values());
            else result = new ElisifSet(...set);

            return result;
        }
    },

    /**
     * An extended map with additional utility methods.
     * Can also be directly constructed from one or more object literals.
    */
    ElisifMap: class ElisifMap extends Map {
        constructor(...objs) {
            super();
            objs.forEach(obj => Object.keys(obj).forEach(key => this.set(key, obj[key])));
        }

        /**
         * Returns a new Object literal constructed from this ElisifMap.
        */
        toObject() {
            return Object.fromEntries(this.entries());
        }

        /**
         * Returns a new JSON string constructed from this ElisifMap.
        */
        toJSON() {
            return JSON.stringify(this.toObject());
        }

        forEach(callback, thisArg) {
            //(value, key, map) => void
            return super.forEach((value, key) => {
                return callback.apply(thisArg, [value, key, this]);
            });
        }

        /**
         * Returns a new ElisifMap containing only items that satsify the provided filter function.
        */
        filter(func) {
            //(value, key, map) => boolean
            
            let newMap = new ElisifMap();

            this.forEach((value, key, map) => {
                if (func(value, key, map)) newMap.set(key, value);
            });

            return newMap;
        }

        /**
         * Returns a new ElisifMap containing only items that do NOT satsify the provided filter function.
        */
        sweep(func) {
            //(value, key, map) => boolean
        
            let newMap = new ElisifMap();

            this.forEach((value, key, map) => {
                if (!func(value, key, map)) newMap.set(key, value);
            });

            return newMap;
        }

        /**
         * Partitions and returns an array of two new ElisifMaps.
         * The first contains items that passed the filter, and the second contains items that failed the filter.
        */
        partition(func) {
            //(value, key, map) => boolean
            let trueMap = this.filter(func);
            let falseMap = this.sweep(func);

            return [ElisifMap.from(trueMap), ElisifMap.from(falseMap)];
        }

        static from(map) {
            var result;
            if (map instanceof Map) result = new ElisifMap(Object.fromEntries(map.entries()));
            else if (typeof map === 'object') result = new ElisifMap(map);

            return result;
        }
    }
}