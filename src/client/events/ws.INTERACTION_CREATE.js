const BaseModal = require('../../structures/BaseModal');
const { InteractionType, ComponentType } = require('discord-api-types/v10');
const { MessageComponentInteraction, BaseMessageComponent } = require("discord.js");
const ComponentInteraction = require('../../structures/ComponentInteraction');
const { Edist } = require('../../util');

module.exports = (client, data) => {
    if (!data.type) return;

    if (data.type == InteractionType.ModalSubmit) {

        if (!data.message) data.message = { id: "0".repeat(18) };

        const baseInteraction = new MessageComponentInteraction(client, data);
        baseInteraction.type = "MODAL_SUBMIT";
        const interaction = new ComponentInteraction(client, baseInteraction);

        const modalFields = [];
        data.data.components.forEach(row => row.components.forEach(rawField => {
            const field = rawField.type == ComponentType.TextInput ? BaseModal.decodeTextInput(rawField) : new BaseMessageComponent(rawField);
            modalFields.push(field);
        }))

        interaction.fields = new Edist(modalFields.map(field => [field.customId, field]));
        interaction.values = new Edist(modalFields.map(field => [field.customId, field.value]));

        client.emit('interactionCreate', interaction);
        return;
    }
    else if (data.type == InteractionType.ApplicationCommand) {
        // Allow resolving attachment arguments in slash commands
        if (data?.data?.resolved?.attachments) {
            require("../../features/syntax").SyntaxCache.addResolvedAttachments(data.id, data.data.resolved.attachments);
        }
    }
}