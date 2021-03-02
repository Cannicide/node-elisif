//Client and command handler, formerly found in server.js
//A better, simpler way of handling a bot

//Command class
const Command = require("./command");

//Express app initialized
const express = require('express');
const app = express();

//Discord.js initialized
const Discord = require('discord.js');
var bot_intents = [];

//File system initialized
const fs = require("fs");

var commands = [];
var pfix = "/";
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

  //Get aliases defined through Command constructor as well as enabled expansions:
  cmdfiles.push(aliases);

  //Import commands:
  cmdfiles.forEach((item) => {
      var file = require(`${directory}/${item.substring(0, item.length - 3)}`);
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
  return commands;

}

function setPrefix(prefix) {
  pfix = prefix || pfix || "/";
  return pfix;
}

function getPrefix() {
  return pfix;
}

function handleCommand(message, cmds) {

  cmds = cmds || commands;

  //Command determination:

  var components = message.content.split(" ");
  var commandWithPrefix = components[0].toLowerCase();
  var args = components.slice(1);

  var escapedPrefix = pfix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //Potentially might need to add another back slash to second param here
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
        cmd.set(message, pfix);

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

  get get() { return this.#selected;}
}

class ExtendedClient extends Discord.Client {

  isextended = true;

  /**
   * Extended Discord Client by Cannicide#2753
   * @author Cannicide#2753
   * @param {Object} p0 - Client options
   * @param {Array} [p0.intents] - List of discord intents to use.
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
   */ 
  constructor({intents, name, presences, logs, prefix, port, twitch, autoInitialize, presenceDuration}) {

    super({intents: intents || bot_intents, ws:{intents: intents || bot_intents}});

    if (client) {
      this = client;
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
      get: () => commands
    };

    this.prefix = {
      get: getPrefix,
      set: setPrefix
    };

    if (prefix) this.prefix.set(prefix);

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

    this.once("ready", () => {
      this.presenceCycler(presences);

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

    });

    client = this;

  }

}

// /**
//  * Extended Discord Client by Cannicide#2753
//  * @author Cannicide#2753
//  * @param {Object} p0 - Client options
//  * @param {Array} [p0.intents] - List of discord intents to use.
//  * @param {String} [p0.name] - The discord bot's name.
//  * @param {Array} [p0.presences] - Presences ("playing _" statuses) to cycle through every 10 minutes.
//  * @param {Object} [p0.logs] - Logging options
//  * @param {String} p0.logs.guildID - ID of the guild in which logging will occur.
//  * @param {String} p0.logs.channelName - Name of the channel in which logging will occur.
//  * @param {String} [p0.prefix] - The prefix to use for the bot's commands
//  * @param {Number} [p0.port] - The port for Express to listen on when initializing the Client. Defaults to the PORT environment variable.
//  * @param {String} [p0.twitch] - The twitch channel URL to use for the bot's presence. Defaults to Cannicide's twitch channel.
//  * @param {Object} [p0.autoInitialize] - Auto-initialization options.
//  * @param {Boolean} p0.autoInitialize.enabled - Automatically initializes the command handler and all commands.
//  * @param {String} [p0.autoInitialize.path] - The full path to your commands folder. Must be a path to a directory containing your command files.
//  */ 
// function ExtendedClient({intents, name, presences, logs, prefix, port, twitch, autoInitialize}) {

//   if (client) return client;
//   bot_intents = intents || bot_intents;
//   name = name || "Discord Bot";
//   logs = logs || false;

//   app.use(express.static('public'));

//   port = port || process.env.PORT;
//   if (!port) throw new Error("Please specify a port to listen on when initializing your Elisif Client.");

//   const listener = app.listen(port, function() {
//     console.log(`${name} listening on port ${listener.address().port}`);
//   });

//   var local_client = new Discord.Client({intents: bot_intents, ws:{intents: bot_intents}});

//   client = local_client;
  
//   client.commands = {
//     initialize: initialize,
//     handle: handleCommand,
//     get: () => commands
//   };

//   client.prefix = {
//     get: getPrefix,
//     set: setPrefix
//   };

//   if (prefix) client.prefix.set(prefix);

//   client.intents = bot_intents;
//   client.name = name;
//   client.port = listener.address().port;
//   presences = presences || [`${client.prefix.get()}help`];
//   twitch = twitch || 'https://twitch.tv/cannicide';

//   client.presenceCycler = (presenceArray) => {

//     if (presenceInterval) clearInterval(presenceInterval);

//     function setPresence() {
//         var presence = new Presence(presenceArray);

//         //Allows the status of the bot to be PURPLE (I don't stream on twitch anyways)
//         client.user.setActivity(presence.get(), { type: 'STREAMING', url: twitch });
//     }

//     //Cycles the presence every 10 minutes
//     presenceInterval = setInterval(setPresence, 10 * 60 * 1000);
    
//     setPresence("immediate action");

//   }

//   client.once("ready", () => {
//     client.presenceCycler(presences);

//     const logGuild = logs ? client.guilds.cache.get(logs.guildID) : false;
//     const logChannel = logs && logGuild ? logGuild.channels.cache.get(logGuild.channels.cache.find(c => c.name == logs.channelName).id) : false;

//     client.logs = {
//         guild: logGuild,
//         channel: logChannel,
//         send: (message) => {
//           if (!logChannel) return console.log(message);
//           logChannel.send(message);
//         },
//         edit: (messageID, message) => {
//           if (!logChannel) return console.log(message);
//           logChannel.messages.fetch(messageID).then(m => m.edit(message));
//         }
//     };

//     if (autoInitialize && autoInitialize.enabled && autoInitialize.path) client.commands.initialize(autoInitialize.path, client.prefix.get());

//   });

//   return client;

// }

module.exports = {
  Client: ExtendedClient,
  express: app,
  Discord: Discord
}