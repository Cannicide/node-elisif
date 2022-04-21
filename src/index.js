const PacketManager = require('./managers/PacketManager');
const Client = require('./client/Client');
const ClientConfig = require('./client/config/Config');
const util = require('./util');

const Discord = require("discord.js");
const { Sifbase } = require("sifbase");


// Override certain packet handlers:
PacketManager.init();

module.exports = {

    ...util,
    Client,
    ClientConfig,
    // TODO: Export all structures and managers:
    Intent: require('./structures/Intent'),

    // Export all dependencies:
    /** The Discord.js library object. */
    Discord,
    /** The Sifbase library object, used for working with databases. */
    Sifbase

}