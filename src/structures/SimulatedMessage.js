// TODO: Complete SimulatedMessage

const Message = require('./Message');
const { simulateMessage } = require('../util');

module.exports = class SimulatedMessage extends Message {

    #d;
    constructor(client, message) {
        super(client, message);
        this.#d = message;
    }

    reply(optsOrContent) {
        simulateMessage(this.client, optsOrContent, {reply: true});
    }

    simulated = true;

    static from(client, optsOrContent) {
        return new this(client, Message.from(client, optsOrContent));
    }

}