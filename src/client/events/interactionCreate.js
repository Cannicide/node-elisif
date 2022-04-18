const CommandInteraction = require('../../structures/CommandInteraction');
const ComponentInteraction = require('../../structures/ComponentInteraction');
const Interaction = require('../../structures/Interaction');
// const SimulatedInteraction = require('../../structures/SimulatedCommandInteraction');

module.exports = (interaction) => {
    let response;

    if (interaction instanceof Interaction) response = interaction;
    else if (interaction.isCommand()) response = CommandInteraction.from(interaction);
    else if (interaction.isButton()) response = ComponentInteraction.asButton(interaction);
    else if (interaction.isSelectMenu()) response = ComponentInteraction.asSelectMenu(interaction);
    else if (interaction.isMessageComponent()) response = ComponentInteraction.from(interaction);
    else response = Interaction.from(interaction);

    return [response];
};