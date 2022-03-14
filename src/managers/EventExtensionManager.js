const CacheManager = require('./CacheManager');
const EventExtension = require('../structures/EventExtension');

module.exports = class EventExtensionManager extends CacheManager {

    constructor(client) {
        super([], EventExtension);
        this.client = client;
    }

    add(event, callback) {
        if (event instanceof EventExtension) this.set(event.event, (this.get(event.event) ?? []).concat(event));
        else this.add(new EventExtension(this.client, event, callback));

        return this;
    }

}