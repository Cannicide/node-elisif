const ExtendedStructure = require('./ExtendedStructure');
const { hexToRgbColorName, emotes, nonemotes } = require('../util');
const { MessageButton: BaseMessageButton } = require('discord.js');

/**
 * Represents a MessageButton that has already been sent in a message.
 * The methods on SentMessageButton mirror MessageButton, but they additionally edit the original message with any updated button options.
 * @extends BaseMessageButton
 */
module.exports = class SentMessageButton extends ExtendedStructure {

    #edit;
    #remove;
    #b;
    #isGrayed = false;
    #colorBeforeGrayed = "PRIMARY";
    constructor(baseButton, message) {
        super(message?.client, baseButton);
        this.#b = baseButton;
        this.#edit = (key, value) => {
            message.components.edit(baseButton.customId, c => c[key] = value);
        };
        this.#remove = () => message.components.delete(baseButton.customId);

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
        console.warn("EditableButton#setCustomId() error: cannot set custom id of a button that has already been sent.");
        return this;
    }

    setDisabled(disabled = true) {
        this.#edit('disabled', disabled);
        this.#b.setDisabled(disabled);
        return this;
    }

    toggleDisabled() {
        this.#edit('disabled', !this.#b.disabled);
        this.#b.setDisabled(!this.#b.disabled);
        return this;
    }

    setGrayed(grayedOut = true) {
        if (grayedOut && this.#isGrayed) return this; // Trying to gray out when already grayed out
        else if (!grayedOut && !this.#isGrayed) return this; // Trying to ungray when already ungrayed
        if (grayedOut) this.#colorBeforeGrayed = this.#b.style;
        this.#isGrayed = grayedOut;

        this.setDisabled(grayedOut);
        this.setStyle(grayedOut ? "SECONDARY" : this.#colorBeforeGrayed);
        return this;
    }

    setEmoji(emoji) {
        this.#edit('emoji', emoji);
        this.#b.setEmoji(emoji);
        return this;
    }

    setLabel(label, ignoreEmoteParsing = false) {
        label = SentMessageButton.parseLabel(label, ignoreEmoteParsing);
        this.#edit('label', label);
        this.#b.setLabel(label);
        return this;
    }

    setStyle(style) {
        style = SentMessageButton.parseColor(style);
        this.#edit('style', style);
        this.#b.setStyle(style);
        return this;
    }

    setColor(color) {
        return this.setStyle(color);
    }

    setURL(url) {
        this.#edit('url', url);
        this.#b.setURL(url);
        return this;
    }

    isURL() {
        return this.#b.style == "LINK" || !!this.#b.url;
    }

    remove() {
        this.#remove();
        return this;
    }

    toJSON() {
        return this.#b.toJSON();
    }

    static parseColor(color) {
        const buttonStyles = [
            {
                name: "PRIMARY",
                colors: ["blue", "primary", "default"]
            },
            {
                name: "SECONDARY",
                colors: ["gray", "secondary", "black", "white"]
            },
            {
                name: "SUCCESS",
                colors: ["green", "success"]
            },
            {
                name: "DANGER",
                colors: ["red", "danger"]
            }
        ];
        
        if (typeof color === "number" || color.startsWith("#")) {
            // Is hex
            const rgbName = hexToRgbColorName(color);

            if (["black", "white", "gray"].includes(rgbName)) color = "secondary"; // Gray
            else if (["blue", "unknown"].includes(rgbName)) color = "primary"; // Blue
            else color = rgbName; // Red, Green
        }

        const style = buttonStyles.find(s => s.colors.includes(color.toLowerCase()))?.name;
        return style;
    }

    static parseLabel(label, ignoreEmoteParsing = false) {
        const emote = emotes(label, 1)[0];
        if (emote && !btn.emoji && !ignoreEmoteParsing) {
            btn.setEmoji(emote);
            label = nonemotes(label, 1);
        }

        return label;
    }

}