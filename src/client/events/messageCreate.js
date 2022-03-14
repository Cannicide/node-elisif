const Message = require('../../structures/Message');
const SimulatedMessage = require('../../structures/SimulatedMessage');

module.exports = (message) => {
    const client = message.client;
    return [client.simulated ? new SimulatedMessage(client, message) : new Message(client, message)];
};