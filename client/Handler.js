//Client and command handler, formerly found in server.js
//A better, simpler way of handling a bot

//CommandManager class
const CommandManager = require("../managers/CommandManager");

//Global settings
const Settings = require("../systems/settings");

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
const DiscordExtender = require("../systems/extendables");

//Interpreter
const Interpreter = require("../systems/interpreter");

var pfix = "/";
/**
 * @type ExtendedClient
 */
var client = false;

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
  pfix = prefix ?? pfix || "/";
  Settings.Global().set("global_prefix", pfix);
  return pfix;
}

function getPrefix() {
  pfix = Settings.Global().get("global_prefix");
  return pfix;
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
   * @param {Object} [p0.expansions] - Expansions, also known as prewritten command packs, to add to this discord bot.
   * @param {["eval", "help", "vca", "games", "points"]} p0.expansions.enable - List of expansions to enable.
   */ 
  constructor({intents, privilegedIntents, name = "Discord Bot", presences, logs = false, prefix = "/", port, twitch, autoInitialize, presenceDuration, authors, description, expansions = {}}) {

    super(() => {
      //Initialize Discord.js extension before client construction
      new DiscordExtender();
      return {intents: privilegedIntents ? allIntents : intents ?? bot_intents, ws:{intents: privilegedIntents ? allIntents : intents ?? bot_intents}};
    });

    if (client) {
      return client;
    }

    app.use(express.static('public'));

    port = port ?? process.env.PORT;
    if (!port) throw new Error("Please specify a port to listen on when initializing your Elisif Client.");

    //Setup express server
    const listener = app.listen(port, function() {
      console.log(`${name} listening on port ${listener.address().port}`);
    });
    
    //Setup command handling methods
    this.commands = CommandManager;

    //Setup prefix methods
    this.prefix = {
      get: getPrefix,
      set: setPrefix
    };

    if (prefix) this.prefix.set(prefix);

    //Setup bot information
    this.authors = authors;
    this.description = description;
    this.intents = intents ?? bot_intents;
    this.name = name;
    this.port = listener.address().port;
    expansions.enable = this.expansions.enable ?? [];

    //Setup expansion methods
    this.expansions = {
      all: () => expansions.enable,
      has: (expansion) => this.expansions.all().includes(expansion),
      get: (expansion) => {
        if (!expansion) return this.expansions.all();
        else if (this.expansions.has(expansion)) return require(`../expansions/${expansion}`);
        else return false;
      }
    }

    //Setup presence cycler method
    presences = presences ?? [`${this.prefix.get()}help`];
    twitch = twitch ?? 'https://twitch.tv/cannicide';

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

    //Utility method to create a discord.js enum
    function createEnum(keys) {
      const obj = {};
      for (const [index, key] of keys.entries()) {
        if (key === null) continue;
        obj[key] = index;
        obj[index] = key;
      }
      return obj;
    }
    
    //Setup channel types enum including new thread channel types
    Discord.Constants.ChannelTypes = createEnum([
      'GUILD_TEXT',
      'DM',
      'GUILD_VOICE',
      'GROUP_DM',
      'GUILD_CATEGORY',
      'GUILD_NEWS',
      'GUILD_STORE',
      ...Array(3).fill(null),
      // 10
      'GUILD_NEWS_THREAD',
      'GUILD_PUBLIC_THREAD',
      'GUILD_PRIVATE_THREAD',
      'GUILD_STAGE_VOICE',
    ]);
    
    //Setup thread channel types enum
    Discord.Constants.ThreadChannelTypes = ['GUILD_NEWS_THREAD', 'GUILD_PUBLIC_THREAD', 'GUILD_PRIVATE_THREAD'];

    //Assign this object to the client variable
    client = this;

    //Setup ready event handler
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

      if (autoInitialize && autoInitialize.enabled && autoInitialize.path) {
        this.commands.initialize(autoInitialize.path);

        //Auto initialize message event
        this.on("message", (message) => {

          try {

            // Avoid bot messages, DM and otherwise:
            if (message.author.bot) return false;
    
            // DM determination:
            if (message.guild === null) {
                
                //Interpret for DiscordSRZ code or other DM interpretation
                Interpreter.dms.handle(message, message.content.split(" "));
    
                return false;
            }
          
    
            //Handle command:
            var cmd = this.commands.handle(message);
    
            //Handle messages to be interpreted:
            if (!cmd) {
                Interpreter.messages.handle(message, message.content.split(" "));
            }
      
          }
          catch (err) {
              message.channel.send(`Errors found:\n\`\`\`${err}\nAt ${err.stack}\`\`\``);
          }

        });

        //Auto initialize interpreting reaction add
        this.on("messageReactionAdd", (r, user) => {
          Interpreter.reactions.handle(r, user, true);
        });
        
        //Auto initialize interpreting reaction remove
        this.on("messageReactionRemove", (r, user) => {
          Interpreter.reactions.handle(r, user, false);
        });

      }

      refreshCache();

    });

    //Setup custom event handlers
    DiscordExtender.extendEvents(client);

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