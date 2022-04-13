const Interaction = require('./Interaction');
const { extendedFunction, asReplyOptions, deepExtendInstance } = require('../util');
const { MessageComponentInteraction: BaseInteraction } = require("discord.js");

module.exports = class ComponentInteraction extends Interaction {

    /** @type {BaseInteraction} */
    #c;
    constructor(client, interaction) {
        super(client, interaction);
        this.#c = interaction;
    }

    get interactionId() {
        return this.#c.id;
    }

    get message() {
        if (!this.#c.message) return null;
        const Message = require('./Message');
        return new Message(this.client, this.#c.message);
    }

    get update() {
        if (!this.message) throw new Error('Cannot call Component#update() on a component without a defined message.');
        return extendedFunction((optsOrContent) => {
            return this.#c.update(asReplyOptions(optsOrContent));
        }, {
            defer: () => {
                return this.#c.deferUpdate(asReplyOptions(null));
            },
            delete: (opts = { timeout: null, filter: null }) => {
                return this.message.delete(opts);
            },
            fetch: () => {
                return this.message.fetch();
            }
        });
    }

    noReply() {
        return this.update.defer();
    }

    static getParts(baseInteraction) {
        const componentInteraction = super.from(baseInteraction);
        const baseComponent = componentInteraction.message.components.get(baseInteraction.customId);
        return [componentInteraction, baseComponent];
    }

    /**
     * 
     * @param {*} baseInteraction 
     * @returns {import('./SentMessageButton') & ComponentInteraction}
     */
    static asButton(baseInteraction) {
        const SentMessageButton = require('../structures/SentMessageButton');
        const [componentInteraction, baseComponent] = this.getParts(baseInteraction);

        const sentButton = new SentMessageButton(baseComponent, componentInteraction.message);
        deepExtendInstance(componentInteraction, sentButton);
        return componentInteraction;
    }

}