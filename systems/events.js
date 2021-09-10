//Contains various extensions of discord.js events.

module.exports = class DiscordExtender {

    static extendEvents(client) {

        const { Events } = require('discord.js').Constants;

        Events.BUTTON_CLICK = 'buttonClick';
        Events.MENU_SELECT = 'menuSelect';
        Events.SLASH_COMMAND = 'slashCommand';
        Events.CONTEXT_MENU = 'contextMenu';
        Events.SERVER_BOOST = 'serverBoost';

        // Emit interaction events
        client.on('interactionCreate', (interaction) => {

            //Interaction Type = Context Menu
            if (interaction.isContextMenu()) {
                client.emit('contextMenu', interaction);
                return;
            }

            //Interaction Type = Slash Command
            if (interaction.isCommand()) {
                client.emit('slashCommand', interaction);
                return;
            }
            
            //Message Components

            //Component Type = Button
            if (interaction.isButton()) {
                client.emit('buttonClick', interaction);
                return;
            }

            //Component Type = Select Menu
            else if (interaction.isSelectMenu()) {
                client.emit('menuSelect', interaction);
                return;
            }
        });

        // Emit server boost events
        client.on("guildMemberUpdate", (oldMember, newMember) => {
            if (oldMember.premiumSinceTimestamp !== newMember.premiumSinceTimestamp) client.emit('serverBoost', newMember);
        });

    }

}