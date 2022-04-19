const Interaction = require('./Interaction');
const { extendedFunction, asReplyOptions, deepExtendInstance } = require('../util');
const { MessageComponentInteraction: BaseInteraction } = require("discord.js");

module.exports = class ComponentInteraction extends Interaction {

    /** @type {BaseInteraction} */
    #c;
    constructor(client, interaction) {
        super(client, interaction);
        this.#c = interaction;

        this.interactionId = this.#c.id;
        this.messageId = this.#c.message.id;
    }

    get message() {
        if (!this.#c.message) return null;
        const Message = require('./Message');
        return new Message(this.client, this.#c.message);
    }

    get update() {
        if (!this.message) throw new Error('Cannot call Component#update() on a component without a defined message.');
        return extendedFunction((optsOrContent) => {
            if (this.acknowledged && !i.replied) return console.warn(Interaction.PseudoInteractionAcknowledgedError);
            // TODO: replace with InteractionAcknowledgedError ^^
            this.acknowledged = true;

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

    /**
     * 
     * @param {*} baseInteraction 
     * @returns {import('./SentMessageSelectMenu') & ComponentInteraction & { selected: string }}
     */
    static asSelectMenu(baseInteraction) {
        const SentSelectMenu = require('../structures/SentMessageSelectMenu');
        const [componentInteraction, baseComponent] = this.getParts(baseInteraction);

        const selectMenu = new SentSelectMenu(baseComponent, componentInteraction.message);
        deepExtendInstance(componentInteraction, selectMenu);

        // Add 'selected' property, works similar to 'values' but doesn't always return array (like String.match())
        if (!componentInteraction.values?.length) Object.defineProperty(componentInteraction, "selected", { value: null, writable: false });
        else if (componentInteraction.values.length == 1) Object.defineProperty(componentInteraction, "selected", { value: componentInteraction.values[0], writable: false });
        else Object.defineProperty(componentInteraction, "selected", { value: componentInteraction.values, writable: true });

        return componentInteraction;
    }

}