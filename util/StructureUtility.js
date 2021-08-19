
class StructureUtility {

    static map = new Map();

    /**
     * @param {import("./Utility")} util
    */
    constructor(snowflake, util) {
        this.util = util;
        this.snowflake = snowflake.id;
        
        this.elisif = require("../index").getInstance();
        this.client = this.elisif.getClient(snowflake.client.user.id);
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

    isUtility() {
        return true;
    }

}

module.exports = StructureUtility;