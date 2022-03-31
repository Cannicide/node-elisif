const CacheManager = require('./CacheManager');
const Message = require('../structures/Message');

module.exports = class MessageManager extends CacheManager {

    #m;
    constructor(messages) {
        super([...(messages?.cache?.entries() ?? [])].map(
            ([id, m]) => [id, new Message(messages?.client, m)]
        ), Message, messages);
        this.#m = messages;
        /** @type {(message:Message) => Promise<void>} */
        this.remove = (message) => this.#m.delete(message);
    }

    /**
     * Deletes all messages in a channel.
     * 
     * Because this is normally impossible due to rate and API limits, this method does not truly delete any individual messages.
     * Instead, it clones the entire channel, deletes the original, and then positions the clone in the location of the original.
     * All settings and permissions on the original are kept by the clone; however, as expected of clearing a channel, all pins are cleared.
     */
    async pseudoClear() {
        const pos = this.#m.channel.position;

        try {
            let ch = await this.#m.channel.clone();
            await ch.setPosition(pos);
        }
        catch (err) {
            throw new Error("An error occurred: failed to pseudoClear the channel.");
        }

        return await this.#m.channel.delete();
    }

}