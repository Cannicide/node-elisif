//Contains various extensions of discord.js capabilities, including insertion of node-elisif methods and features.

const Discord = require('discord.js');

const ExtendedMessage = require("../structures/ExtendedMessage");
const ExtendedChannel = require("../structures/ExtendedChannel");
const ExtendedGuild = require("../structures/ExtendedGuild");

const ButtonComponent = require("../structures/ButtonComponent");
const SelectMenuComponent = require("../structures/SelectMenuComponent");
const ThreadChannel = require("../structures/ThreadChannel");


//Experimental direct extension of Discord.js structures
module.exports = class DiscordExtender {

    constructor() {

        //Extend message
        Discord.Structures.extend("Message", BasicMessage => ExtendedMessage(BasicMessage));

        //Extend channel
        Discord.Structures.extend("TextChannel", BasicChannel => ExtendedChannel(BasicChannel));
        Discord.Structures.extend("NewsChannel", BasicChannel => ExtendedChannel(BasicChannel));

        //Extend guild
        Discord.Structures.extend("Guild", BasicGuild => ExtendedGuild(BasicGuild));

    }

    static extendMessage(message) {
        var AdvMessage = ExtendedMessage(Discord.Message);

        return new AdvMessage(message.client, message, message.channel);
    }

    static extendChannel(message) {
        var AdvChannel = ExtendedChannel(typeof message.channel);

        return new AdvChannel(message.guild, message.channel);
    }

    static extendGuild(message) {
        var AdvGuild = ExtendedGuild(Discord.Guild);

        return new AdvGuild(message.client, message.guild);
    }

    static AdvancedMessage = ExtendedMessage(Discord.Message);
    static AdvancedTextChannel = ExtendedChannel(Discord.TextChannel);
    static AdvancedGuild = ExtendedGuild(Discord.Guild);

    static extendEvents(client) {

        const { Events } = require('discord.js').Constants;

        Events.BUTTON_CLICK = 'buttonClick';

        //Emit interaction events
        client.ws.on('INTERACTION_CREATE', (data) => {
            if (!data.message) return;

            //Type 2 = button
            if (data.data.component_type && data.data.component_type == 2) {
                const buttonMsg = new ButtonComponent(client, data);
                client.emit('buttonClick', buttonMsg);
            }

            //Type 3 = select menu
            else if (data.data.component_type && data.data.component_type == 3) {
                const buttonMsg = new SelectMenuComponent(client, data);
                client.emit('menuSelect', buttonMsg);
            }
        });

        //Emit LIMITED threadCreate event
        //(Only emits when a thread is created using node-elisif; current API version cannot receive proper THREAD_CREATE events)
        client.ws.on('THREAD_CREATE', (data) => {
            const threadChannel = new ThreadChannel(data.guild, data, client);
            client.emit("threadCreate", threadChannel);
        });

    }

}