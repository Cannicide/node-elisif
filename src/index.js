const PacketManager = require('./managers/PacketManager');
const Client = require('./client/Client');
const util = require('./util');

const Discord = require("discord.js");
const fetch = require("node-fetch");
const { Sifbase } = require("sifbase");


// Override certain packet handlers:
PacketManager.init();

module.exports = {

    ...util,
    Client,
    // TODO: Export all structures and managers:
    Intent: require('./structures/Intent'),

    // Export all dependencies:
    /** The Discord.js library object. */
    Discord,
    /** The node-fetch library method, used for making HTTP requests. */
    fetch,
    /** The Sifbase library object, used for working with databases. */
    Sifbase

}