const ExtendedStructure = require('./ExtendedStructure');
const { emotes, nonemotes } = require('../util');
const { MessageSelectMenu: BaseMessageSelectMenu } = require('discord.js');

/**
 * Represents a MessageSelectMenu that has already been sent in a message.
 * The methods on SentMessageSelectMenu mirror MessageSelectMenu, but they additionally edit the original message with any updated menu options.
 * @extends BaseMessageSelectMenu
 */
module.exports = class SentMessageSelectMenu extends ExtendedStructure {

    #edit;
    #remove;
    #s;
    constructor(baseMenu, message) {
        super(message?.client, baseMenu);
        this.#s = baseMenu;
        this.#edit = (key, value) => {
            message.components.edit(baseMenu.customId, c => Object.defineProperty(c, key, {
                value,
                writable: true,
                enumerable: true
            }));
        };
        this.#remove = () => message.components.delete(baseMenu.customId);

        /** 
         * The index of the action row this button belongs to.
         * @type {Number} 
         * @readonly
         */
        this.row;

        /**
         * The index of the button in the action row.
         * @type {Number}
         * @readonly
         */
        this.col;
    }

    setCustomId(customId) {
        console.warn("EditableSelectMenu#setCustomId() error: cannot set custom id of a select menu that has already been sent.");
        return this;
    }

    setDisabled(disabled = true) {
        this.#edit('disabled', disabled);
        this.#s.setDisabled(disabled);
        return this;
    }

    toggleDisabled() {
        this.#edit('disabled', !this.#s.disabled);
        this.#s.setDisabled(!this.#s.disabled);
        return this;
    }

    setMax(max = 0) {
        this.#edit('maxValues', max);
        this.#s.setMaxValues(max);
        return this;
    }

    setMin(min = 0) {
        this.#edit('minValues', min);
        this.#s.setMinValues(min);
        return this;
    }

    setPlaceholder(placeholder) {
        this.#edit('placeholder', placeholder);
        this.#s.setPlaceholder(placeholder);
        return this;
    }

    addOption(option = {}) {
        if (typeof option === 'string') option = { label: option };
        let { label, value = null, description = null, emoji = null, default: selected = null, ignoreEmoteParsing = false } = option;

        value ??= label;
        
        const parsedLabel = SentMessageSelectMenu.parseLabelAndEmote(label, ignoreEmoteParsing);
        label = parsedLabel.label;
        emoji ??= parsedLabel.emote;

        this.#s.addOptions({
            label,
            value,
            description,
            emoji,
            default: selected
        })
        this.#edit('options', this.#s.options);

        return this;
    }

    addOptions(...opts) {
        for (const opt of opts.flat()) this.addOption(opt);
        return this;
    }

    remove() {
        this.#remove();
        return this;
    }

    toJSON() {
        return this.#s.toJSON();
    }

    static parseLabelAndEmote(label, ignoreEmoteParsing = false) {
        let emote = emotes(label, 1)[0];
        if (emote && !ignoreEmoteParsing) {
            label = nonemotes(label, 1);
        }
        else if (emote) emote = null;

        return { label, emote };
    }

}