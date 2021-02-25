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

  pfix = prefix || pfix || "/";

  //Import commands:
    var cmdfiles = fs.readdirSync(directory);
    cmdfiles.forEach((item) => {
        var file = require(`./${directory}/${item.substring(0, item.length - 3)}`);
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

  var escapedPrefix = pfix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
function Presence(presences) {

    var options = presences;
    var selected = options[index];
    index += 1;
    if (index == options.length) index = 0;

    this.get = () => {
        return selected;
    }
}

/**
 * Extended Discord Client by Cannicide#2753
 * @author Cannicide#2753
 * @param {Object} p0 - Client options
 * @param {Array} p0.intents - List of discord intents to use.
 * @param {String} p0.name - The discord bot's name.
 * @param {Array} p0.presences - Presences ("playing _" statuses) to cycle through every 10 minutes.
 * @param {Object} p0.logs - Logging options
 * @param {String} p0.logs.guildID - ID of the guild in which logging will occur.
 * @param {String} p0.logs.channelName - Name of the channel in which logging will occur.
 */
function ExtendedClient({intents, name, presences, logs}) {

  if (client) return client;
  bot_intents = intents || bot_intents;
  name = name || "Discord Bot";
  presences = presences || ["/help"];
  logs = logs || false;

  app.use(express.static('public'));

  const listener = app.listen(process.env.PORT, function() {
    console.log(`${name} listening on port ${listener.address().port}`);
  });

  var local_client = new Discord.Client({intents: bot_intents, ws:{intents: bot_intents}});

  client = local_client;
  
  client.commands = {
    initialize: initialize,
    handle: handleCommand,
    get: () => commands
  };

  client.prefix = {
    get: getPrefix,
    set: setPrefix
  };

  client.intents = bot_intents;
  client.name = name;
  client.port = listener.address().port;

  client.presenceCycler = (presenceArray) => {

    if (presenceInterval) clearInterval(presenceInterval);

    function setPresence() {
        var presence = new Presence(presenceArray);

        //Allows the status of the bot to be PURPLE (I don't stream on twitch anyways)
        client.user.setActivity(presence.get(), { type: 'STREAMING', url: 'https://twitch.tv/cannicide' });
    }

    //Cycles the presence every 10 minutes
    presenceInterval = setInterval(setPresence, 10 * 60 * 1000);
    
    setPresence("immediate action");

  }

  client.once("ready", () => {
    client.presenceCycler(presences);

    const logGuild = logs ? client.guilds.cache.get(logs.guildID) : false;
    const logChannel = logs && logGuild ? logGuild.channels.cache.get(logGuild.channels.cache.find(c => c.name == logs.channelName).id) : false;

    client.logs = {
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
    }
  });

  return client;

}

module.exports = {
  Client: ExtendedClient,
  express: app,
  Discord: Discord
}