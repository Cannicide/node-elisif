const PacketManager = require('./managers/PacketManager');
const Client = require('./client/Client');
const ClientConfig = require('./client/config/Config');
const util = require('./util');

const Discord = require("discord.js");
const { Sifbase } = require("sifbase");


// Override certain packet handlers:
PacketManager.init();

module.exports = {

    Client,
    ClientConfig,

    // Export all structures:
    BaseModal: require('./structures/BaseModal'),
    ClientUser: require('./structures/ClientUser'),
    CommandInteraction: require('./structures/CommandInteraction'),
    ComponentInteraction: require('./structures/ComponentInteraction'),
    DMChannel: require('./structures/DMChannel'),
    EventExtension: require('./structures/EventExtension'),
    ExtendedStructure: require('./structures/ExtendedStructure'),
    Guild: require('./structures/Guild'),
    GuildChannelInterface: require('./structures/GuildChannelInterface'),
    GuildMember: require('./structures/GuildMember'),
    Intent: require('./structures/Intent'),
    Interaction: require('./structures/Interaction'),
    Message: require('./structures/Message'),
    MessageEmbed: require('./structures/MessageEmbed'),
    SendableComponentFactory: require('./structures/SendableComponentFactory'),
    SentMessageButton: require('./structures/SentMessageButton'),
    SentMessageSelectMenu: require('./structures/SentMessageSelectMenu'),
    SimulatedMessage: require('./structures/SimulatedMessage'),
    SyntaxCommand: require('./structures/SyntaxCommand'),
    SyntaxContextMenu: require('./structures/SyntaxContextMenu'),
    TextBasedChannel: require('./structures/TextBasedChannel'),
    TextChannel: require('./structures/TextChannel'),
    Timestamp: require('./structures/Timestamp'),
    User: require('./structures/User'),
    VoiceBasedChannel: require('./structures/VoiceBasedChannel'),
    VoiceChannel: require('./structures/VoiceChannel'),

    // TODO: Export all managers:

    // Export all dependencies:
    /** The Discord.js library object. */
    Discord,
    /** The Sifbase library object, used for working with databases. */
    Sifbase

}

// Manually export all individual properties from 'util':
module.exports.CREATE_MESSAGE_CUSTOM_METHODS = util.CREATE_MESSAGE_CUSTOM_METHODS;
module.exports.Edist = util.Edist;
module.exports.Emap = util.Emap
module.exports.Equeue = util.Equeue
module.exports.Eset = util.Eset
module.exports.Estack = util.Estack
module.exports.ReadonlyEdist = util.ReadonlyEdist
module.exports.boa = util.boa
module.exports.button = util.button
module.exports.channels = util.channels
module.exports.command = util.command
module.exports.commandAutocompleter = util.commandAutocompleter
module.exports.contextMenu = util.contextMenu
module.exports.createMessage = util.createMessage
module.exports.database = util.database
module.exports.debugMethod = util.debugMethod
module.exports.deepExtendInstance = util.deepExtendInstance
module.exports.embed = util.embed
module.exports.emotes = util.emotes
module.exports.extendedFunction = util.extendedFunction
module.exports.filesize = util.filesize
module.exports.formatTime = util.formatTime
module.exports.globals = util.globals;
module.exports.guilds = util.guilds
module.exports.ion = util.ion;
module.exports.hexToRgbColorName = util.hexToRgbColorName
module.exports.loadToken = util.loadToken
module.exports.modal = util.modal
module.exports.nonemotes = util.nonemotes
module.exports.parseBuilder = util.parseBuilder
module.exports.parseComponent = util.parseComponent
module.exports.parseTime = util.parseTime
module.exports.random = util.random
module.exports.selectMenu = util.selectMenu
module.exports.settings = util.settings
module.exports.similarity = util.similarity
module.exports.simulateMessage = util.simulateMessage
module.exports.sortedSimilar = util.sortedSimilar
module.exports.users = util.users