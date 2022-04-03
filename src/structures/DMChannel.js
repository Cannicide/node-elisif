const TextBasedChannel = require('./TextBasedChannel');
const { DMChannel: BaseDMChannel } = require("discord.js");

module.exports = class DMChannel extends TextBasedChannel {

    /** @type {BaseDMChannel} */
    #d;
    constructor(client, channel) {
        super(client, channel);
        this.#d = channel;
    }

    get recipient() {
        if (!this.#d.recipient) return;
        const User = require('./User');
        return new User(this.client, this.#d.recipient);
    }

    get recipients() {
        if (!this.#d.recipients) return;
        const User = require('./User');
        return this.#d.recipients.map(recipient => new User(this.client, recipient));
    }

}