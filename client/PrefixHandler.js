
class PrefixHandler {

    constructor(client) {
        this.client = client;
    }

    set(prefix) {
        let pfix = prefix ?? "/";
        this.client.settings.Global().set("global_prefix", pfix);
        return pfix;
      }
      
    get() {
        let pfix = this.client.settings.Global().get("global_prefix");
        return pfix;
    }

}

module.exports = PrefixHandler;