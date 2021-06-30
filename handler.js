//Client and command handler, formerly found in server.js
//A better, simpler way of handling a bot

//Command class
const Command = require("./command");

//Global settings
const Settings = require("./settings");

//Express app initialized
const express = require('express');
const app = express();

//Discord.js initialized
const Discord = require('discord.js');
var bot_intents = ["GUILDS", "GUILD_BANS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "DIRECT_MESSAGES"];
const allIntents = Object.assign([], bot_intents);
allIntents.push("GUILD_MEMBERS");
allIntents.push("GUILD_PRESENCES");

//Discord.js extension
const DiscordExtender = require("./extendables");

//File system initialized
const fs = require("fs");

var commands = [];
var pfix = "/";
/**
 * @type ExtendedClient
 */
var client = false;

function initialize(directory, prefix) {

  /**
  * @type Command[]
  */
  var requisites = [];
  var aliases = require("./aliases");

  pfix = prefix || pfix || "/";

  if (directory.endsWith("/")) directory = directory.substring(0, directory.length - 1);

  //Get user's commands:
  var cmdfiles = fs.readdirSync(directory);

  //Get aliases defined through Command constructor:
  cmdfiles.push(aliases);

  //Get enabled expansions:
  var expansions = fs.readdirSync(__dirname + "/expansions");
  expansions.forEach(expansion => {
    if (client.expansions.includes(expansion.substring(0, expansion.length - 3))) cmdfiles.push(require(`${__dirname + "/expansions"}/${expansion.substring(0, expansion.length - 3)}`));
  });

  //Import commands:
  cmdfiles.forEach((item) => {
      var file = typeof item === 'string' ? require(`${directory}/${item.substring(0, item.length - 3)}`) : item;
      if (file instanceof Command) {
          requisites.push(file);
      }
      else if ("commands" in file) {
          file.commands.forEach((alias) => {
              if (alias instanceof Command) requisites.push(alias);
          })

          if (typeof file.initialize === 'function') {
            file.initialize();
          }
      }
  });

  commands = requisites[requisites.length - 1].getCommands();

  if (Settings.Global().get("debug_mode")) console.log("Loaded commands:", commands.map(v => v.name));

  return commands;

}

async function refreshCache() {

  if (!Settings.Global().get("refresh_cache_on_boot")) return;

  var totalMessagesFetched = 0;

  for (var guild of client.guilds.cache.array()) {

    for (var channel of guild.channels.cache.filter(c => c.type == "text").array()) {

      var messages = await channel.messages.fetch();
      totalMessagesFetched += messages.size;

    }

  };

  console.log("Successfully fetched and cached " + totalMessagesFetched + " messages.");

}

function setPrefix(prefix) {
  pfix = prefix || pfix || "/";
  Settings.Global().set("global_prefix", pfix);
  return pfix;
}

function getPrefix() {
  pfix = Settings.Global().get("global_prefix");
  return pfix;
}

function handleCommand(message, cmds) {

  cmds = cmds || commands;

  var localPrefix = getPrefix();
  if (Settings.Local(message.guild.id).get("local_prefix")) localPrefix = Settings.Local(message.guild.id).get("local_prefix");

  //Command determination:

  var components = message.content.split(" ");
  var commandWithPrefix = components[0].toLowerCase();
  var args = components.slice(1);

  var escapedPrefix = localPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var foundPrefix = new RegExp(escapedPrefix);

  var command = commandWithPrefix.replace(foundPrefix, "");

  if (args.length < 1) {
    var args = false;
  }

  //Check for command:
  var cmd = false;

  cmds.forEach(item => {
      if (item.name == command) {
        cmd = item.cmd;
      }
  });


  if (cmd && commandWithPrefix.match(foundPrefix)) {
    message.channel.startTyping();

    setTimeout(() => {
        cmd.set(message, localPrefix);

        cmd.execute(args).catch(err => {
          message.reply("an error occurred:\n\n" + err);
        });

        message.channel.stopTyping();
    }, 1000);

    //Is a command, successfully handled
    return true;
  }
  //Is not a command, did not handle
  else return false;

}

//Cycle through various presences instead of a single discord presence.
var index = 0;
var presenceInterval = false;

/**
 * A randomized presence message.
 * @returns {Presence}
 */
class Presence {

  #options;
  #selected;

  /**
   * 
   * @param {String[]} presences - A list of presences to cycle through.
   */
  constructor(presences) {

    this.#options = presences;
    this.#selected = this.#options[index];
    index += 1;
    if (index == this.#options.length)
      index = 0;

  }

  get() { return this.#selected;}
}

//Method to initialize Discord.js extension before client construction
function preInitialize(p0) {
  new DiscordExtender();
  return p0;
}

//Initialize custom events
function customEventHandlers(client) {
  DiscordExtender.extendEvents(client);
}

class ExtendedClient extends Discord.Client {

  isextended = true;

  /**
   * Extended Discord Client by Cannicide#2753
   * @author Cannicide#2753
   * @param {Object} p0 - Client options
   * @param {Array} [p0.intents] - List of discord intents to use.
   * @param {boolean} [p0.privilegedIntents] - Whether to enable priveleged intents.
   * @param {String} [p0.name] - The discord bot's name.
   * @param {Array} [p0.presences] - Presences ("playing _" statuses) to cycle through (every 10 minutes or as set in presenceDuration).
   * @param {Object} [p0.logs] - Logging options
   * @param {String} p0.logs.guildID - ID of the guild in which logging will occur.
   * @param {String} p0.logs.channelName - Name of the channel in which logging will occur.
   * @param {String} [p0.prefix] - The prefix to use for the bot's commands
   * @param {Number} [p0.port] - The port for Express to listen on when initializing the Client. Defaults to the PORT environment variable.
   * @param {String} [p0.twitch] - The twitch channel URL to use for the bot's presence. Defaults to Cannicide's twitch channel.
   * @param {Object} [p0.autoInitialize] - Auto-initialization options.
   * @param {Boolean} p0.autoInitialize.enabled - Automatically initializes the command handler and all commands.
   * @param {String} [p0.autoInitialize.path] - The full path to your commands folder. Must be a path to a directory containing your command files.
   * @param {Number} [p0.presenceDuration] - How often to cycle through presences, in minutes. Defaults to 10 minutes.
   * @param {Object[]} [p0.authors] - Details of the developer(s) and/or owner(s) of this bot.
   * @param {String} p0.authors[].username - The username of this developer. Does not need to match the actual discord username of this developer.
   * @param {String} p0.authors[].id - The Discord ID of this developer. Required for some features and expansions, such as the eval expansion.
   * @param {String} [p0.description] - The description of this discord bot. Used in some features and expansions, such as the help expansion.
   * @param {["eval", "help"]} [p0.expansions] - Expansions, also known as prewritten command packs, to add to this discord bot.
   */ 
  constructor({intents, privilegedIntents, name, presences, logs, prefix, port, twitch, autoInitialize, presenceDuration, authors, description, expansions}) {

    super(preInitialize({intents: privilegedIntents ? allIntents : intents || bot_intents, ws:{intents: privilegedIntents ? allIntents : intents || bot_intents}}));

    if (client) {
      return client;
    }

    name = name || "Discord Bot";
    logs = logs || false;

    app.use(express.static('public'));

    port = port || process.env.PORT;
    if (!port) throw new Error("Please specify a port to listen on when initializing your Elisif Client.");

    const listener = app.listen(port, function() {
      console.log(`${name} listening on port ${listener.address().port}`);
    });
    
    this.commands = {
      initialize: initialize,
      handle: handleCommand,
      get: (specificCommand) => {
        if (!specificCommand) return commands;
        else return commands.find(v => v.name == specificCommand);
      }
    };

    this.prefix = {
      get: getPrefix,
      set: setPrefix
    };

    if (prefix) this.prefix.set(prefix);

    this.authors = authors;
    this.description = description;
    this.expansions = expansions;

    this.intents = intents || bot_intents;
    this.name = name;
    this.port = listener.address().port;
    presences = presences || [`${this.prefix.get()}help`];
    twitch = twitch || 'https://twitch.tv/cannicide';

    this.presenceCycler = (presenceArray) => {

      if (presenceInterval) clearInterval(presenceInterval);

      var setPresence = function() {
          var presence = new Presence(presenceArray);

          //Allows the status of the bot to be PURPLE (I don't stream on twitch anyways)
          this.user.setActivity(presence.get(), { type: 'STREAMING', url: twitch });
      }.bind(this);

      //Cycles the presence every x (or 10) minutes
      presenceInterval = setInterval(setPresence, (presenceDuration && presenceDuration >= 0.5 ? presenceDuration : 10) * 60 * 1000);
      
      setPresence("immediate action");

    }

    client = this;

    this.once("ready", () => {
      console.log(`${name} is up and running!`);
      if (Settings.Global().get("presence_cycler")) this.presenceCycler(presences);
      else this.user.setActivity(`${this.prefix.get()}help`, {type: 'STREAMING', url: twitch});

      const logGuild = logs ? this.guilds.cache.get(logs.guildID) : false;
      const logChannel = logs && logGuild ? logGuild.channels.cache.get(logGuild.channels.cache.find(c => c.name == logs.channelName).id) : false;

      this.logs = {
          guild: logGuild,
          channel: logChannel,
          send: (message) => {
            if (!logChannel) return console.log(message);
            logChannel.send(message);
          },
          edit: (messageID, message) => {
            if (!logChannel) return console.log(message);
            logChannel.messages.fetch(messageID).then(m => m.edit(message));
          }
      };

      if (autoInitialize && autoInitialize.enabled && autoInitialize.path) this.commands.initialize(autoInitialize.path, this.prefix.get());

      refreshCache();

    });

    customEventHandlers(client);

  }

  /**
   * @return ExtendedClient
   */
  static getInstance() {
    return client;
  }

}

module.exports = class Handler {
  Client = ExtendedClient;
  express = app;
  Discord = Discord
}