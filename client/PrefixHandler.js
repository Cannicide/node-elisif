
const Settings = require("../systems/settings");

class PrefixHandler {

    set(prefix) {
        let pfix = prefix ?? "/";
        Settings.Global().set("global_prefix", pfix);
        return pfix;
      }
      
    get() {
        let pfix = Settings.Global().get("global_prefix");
        return pfix;
    }

}

module.exports = PrefixHandler;