//Contains various extensions of discord.js capabilities, including insertion of node-elisif methods and features.

// const Discord = require('discord.js');

// const ExtendedChannel = require("../structures/ExtendedChannel");
// const ExtendedGuild = require("../structures/ExtendedGuild");

// const ButtonComponent = require("../structures/ButtonComponent");
// const SelectMenuComponent = require("../structures/SelectMenuComponent");
// const ThreadChannel = require("../structures/ThreadChannel");
// const SlashInteraction = require("../structures/SlashInteraction");


//Experimental direct extension of Discord.js structures
module.exports = class DiscordExtender {

    // constructor() {

    //     //Extend message
    //     Discord.Structures.extend("Message", BasicMessage => ExtendedMessage(BasicMessage));

    //     //Extend channel
    //     Discord.Structures.extend("TextChannel", BasicChannel => ExtendedChannel(BasicChannel));
    //     Discord.Structures.extend("NewsChannel", BasicChannel => ExtendedChannel(BasicChannel));

    //     //Extend guild
    //     Discord.Structures.extend("Guild", BasicGuild => ExtendedGuild(BasicGuild));

    // }

    // static extendMessage(message) {
    //     var AdvMessage = ExtendedMessage(Discord.Message);

    //     return new AdvMessage(message.client, message, message.channel);
    // }

    // static extendChannel(message) {
    //     var AdvChannel = ExtendedChannel(typeof message.channel);

    //     return new AdvChannel(message.guild, message.channel);
    // }

    // static extendGuild(message) {
    //     var AdvGuild = ExtendedGuild(Discord.Guild);

    //     return new AdvGuild(message.client, message.guild);
    // }

    // static AdvancedMessage = ExtendedMessage(Discord.Message);
    // static AdvancedTextChannel = ExtendedChannel(Discord.TextChannel);
    // static AdvancedGuild = ExtendedGuild(Discord.Guild);

    static extendEvents(client) {

        // const { Events } = require('discord.js').Constants;

        // Events.BUTTON_CLICK = 'buttonClick';
        // Events.MENU_SELECT = 'menuSelect';
        // Events.THREAD_CREATE = 'threadCreate';
        // Events.SLASH_COMMAND = 'slashCommand';

        //Emit interaction events
        // client.ws.on('INTERACTION_CREATE', (data) => {

        //     //Interaction Type 2 = Slash Command
        //     if (!data.data.component_type && data.type == 2) {
        //         let slash = new SlashInteraction(client, data);
        //         client.emit('slashCommand', slash);
        //         return;
        //     }
            
        //     //Message Components:
        //     if (!data.message) return;

        //     //Component Type 2 = button
        //     if (data.data.component_type && data.data.component_type == 2) {
        //         const buttonMsg = new ButtonComponent(client, data);
        //         client.emit('buttonClick', buttonMsg);
        //         return;
        //     }

        //     //Component Type 3 = select menu
        //     else if (data.data.component_type && data.data.component_type == 3) {
        //         const buttonMsg = new SelectMenuComponent(client, data);
        //         client.emit('menuSelect', buttonMsg);
        //         return;
        //     }
        // });

        //Emit LIMITED threadCreate event
        //(Only emits when a thread is created using node-elisif; current API version cannot receive proper THREAD_CREATE events)
        // client.ws.on('THREAD_CREATE', (data) => {
        //     const threadChannel = new ThreadChannel(data.guild, data, client);
        //     client.emit("threadCreate", threadChannel);
        // });

    }

}