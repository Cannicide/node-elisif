const { Emap, parseTime } = require('../util');
const { InteractionResponseType, ComponentType } = require("discord-api-types/v10");
const ComponentManager = require('../managers/ComponentManager');

/**
 * @typedef {object} BaseModalResolvable
 * @property {string} customId - The custom id of the modal. Try to keep it unique across the entire bot.
 * @property {string} title - The title of the modal.
 * @property {ComponentResolvable[]} components - The components of the modal.
 */

/**
 * @typedef {object} TextInputResolvable
 * @property {string} customId - The custom id of the text input.
 * @property {string} [placeholder] - The placeholder of the text input.
 * @property {string} label - The label of the text input.
 * @property {string} [value] - The pre-filled value of the text input.
 * @property {boolean} [multiline=false] - Whether the text input is multiline. Equivalent to setting style to 'paragraph'.
 * @property {string} style - The style of the text input, 'paragraph' or 'short'/'default'.
 * @property {number} [min] - The minimum length limit of the text input, from 0 to 4000.
 * @property {number} [max] - The maximum length limit of the text input, from 1 to 4000.
 * @property {boolean} [required=true] - Whether the text input is required to be filled.
 */

/**
 * Used to create and represent modals.
 * Similar to Discord.js' MessageButton or MessageSelectMenu classes for their respective component types.
 * @extends BaseModalResolvable
 */
module.exports = class BaseModal {

    static ALL = new Emap();

    /** @param {BaseModalResolvable} [options] */
    constructor(options = null) {
        this.base = { components: [], edit: () => null };
        this.components = new ComponentManager(this.base);
        BaseModal.parseOptions(options, this);
        BaseModal.add(this);
    }

    setCustomId(customId) {
        BaseModal.parseOptions({customId}, this);
        BaseModal.add(this);
        return this;
    }

    setTitle(title) {
        BaseModal.parseOptions({title}, this);
        return this;
    }

    /** @param {TextInputResolvable} component */
    addComponent(component) {
        this.components.add({ ...component, type: component.type ?? "TEXT_INPUT" });
        return this;
    }

    /** @param {...TextInputResolvable} components */
    addComponents(...components) {
        for (const component of components.flat()) this.addComponent(component);
        return this;
    }

    static parseOptions(options, baseModal) {
        options ??= {};
        if (typeof options === "string") options = { customId: options };
        
        for (const key in options) Object.defineProperty(baseModal, key, { value: options[key], writable: true, enumerable: true });
    }

    static parseTextInput(textInput) {

        const textInputStyle = (style) => style?.toLowerCase() == 'paragraph' ? 2 : 1;

        return {
            type: ComponentType.TextInput,
            custom_id: textInput.customId,
            placeholder: textInput.placeholder,
            label: textInput.label,
            value: textInput.value,
            style: textInputStyle(textInput.multiline ? 'paragraph' : textInput.style),
            min_length: textInput.min,
            max_length: textInput.max,
            required: textInput.required ?? true
        }
    }

    static decodeTextInput(parsedTextInput) {
        return {
            customId: parsedTextInput.custom_id,
            placeholder: parsedTextInput.placeholder,
            label: parsedTextInput.label,
            value: parsedTextInput.value && parsedTextInput.value.trim().length ? parsedTextInput.value.trim() : null,
            multiline: parsedTextInput.style == 2,
            style: parsedTextInput.style == 2 ? 'paragraph' : 'short',
            min: parsedTextInput.min_length,
            max: parsedTextInput.max_length,
            required: parsedTextInput.required
        };
    }

    static from(baseModalOrOptions) {
        return new BaseModal(baseModalOrOptions);
    }

    static add(baseModal) {
        if (!baseModal.customId) return;
        BaseModal.ALL.set(baseModal.customId, baseModal);
    }

    /**
     * @param {BaseModalResolvable|BaseModal|String} idOrBaseModal
     * @returns {BaseModal}
     */
    static get(idOrBaseModal) {
        let modal;

        if (typeof idOrBaseModal === 'string') modal = this.ALL.get(idOrBaseModal);
        modal ??= this.from(idOrBaseModal);

        return modal;
    }

    toJSON() {
        return {
            components: this.base.components.map(row => {
                row.components = row.components.map(component => {
                    return { toJSON: () => (component.toJSON ?? BaseModal.parseTextInput)(component) };
                });
                return row.toJSON();
            }),
            custom_id: this.customId,
            title: this.title
        }
    }

    /**
     * Opens the modal and displays it as a response to the specified interaction.
     * @param {*} interaction 
     * @param {Number|String|BigInt} [timeLimit] - A resolvable time limit for the modal, after which it will be assumed that the modal was canceled.
     * @param {String|Function} [errorMessage] - The optional error message to display if the modal is submitted after being exceeding the time limit. Sends a default message if not specified. Or, specify a function to manually handle the modalCancel interaction.
     */
    async open(interaction, timeLimit, errorMessage) {
        if (interaction.deferred || interaction.replied) throw new Error('Error: INTERACTION_ALREADY_REPLIED\nThe interaction has already been acknowledged; unable to open the modal.');
        await interaction.client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: InteractionResponseType.Modal,
                data: this.toJSON()
            }
        });

        interaction.replied = true;
        let modalAcknowledged = false;
        let modalCanceled = false;

        return new Promise(resolve => {
            interaction.client.on("interactionCreate", i => {
                if (i.type != "MODAL_SUBMIT" || modalAcknowledged) return;
                if (modalCanceled) {
                    if (typeof errorMessage != "function") return i.reply(errorMessage ?? "> **You exceeded the time limit; the modal has been canceled.**", true);
                    return errorMessage(i);
                }
                if (i.customId !== this.customId) return;

                modalAcknowledged = true;
                resolve(i);
            });

            if (timeLimit && parseTime(timeLimit)) setTimeout(() => {
                if (modalAcknowledged || modalCanceled) return;
                modalCanceled = true;
                resolve(null);
            }, parseTime(timeLimit));
        });
    }

}