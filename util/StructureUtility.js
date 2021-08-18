
class StructureUtility {

    static map = new Map();

    /**
     * @param {import("./Utility")} util
    */
    constructor(snowflake, util) {
        this.util = util;
        this.snowflake = snowflake;
        
        this.elisif = require("../index").getInstance();
    }

    static get(snowflake) {
        if (StructureUtility.map.has(snowflake)) {
            return StructureUtility.map.get(snowflake);
        }
        return null;
    }

    set() {
        return StructureUtility.map.set(this.snowflake, this);
    }

}

module.exports = StructureUtility;