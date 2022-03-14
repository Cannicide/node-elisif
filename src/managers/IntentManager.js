const CacheManager = require('./CacheManager');
const Intent = require('../structures/Intent');

module.exports = class IntentManager extends CacheManager {

    constructor() {
        super([], Intent);
    }

    add(intent) {

        if (intent instanceof Intent) this.set(intent.name, intent.value);
        else this.add(new Intent(intent));

        return this;
    }

}