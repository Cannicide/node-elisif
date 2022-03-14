module.exports = class EventExtension {

    constructor(client, event, callback) {
        this.client = client;
        this.event = event;
        this.callback = callback;
    }

}