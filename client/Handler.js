//Client and command handler, formerly found in server.js
//A better, simpler way of handling a bot

//CommandManager class
const CommandManager = require("../managers/CommandManager");

//Express app initialized
const express = require('express');
const app = express();
var listener = undefined;

//Discord.js initialized
const Discord = require('discord.js');

//Utility class and intent enums
const Utility = require("../util/Utility");
const bot_intents = Utility.getIntentEnums();
const priv_intents = Utility.getPrivilegedIntentEnums();

//Discord.js extension
const DiscordExtender = require("../systems/events");

//Interpreter
const Interpreter = require("../systems/interpreter");

//Expansion manager
const ExpansionManager = require("../managers/ExpansionManager");

//Presence cycler
const PresenceCycler = require("../client/PresenceCyclerClient");

//Prefix handler
const PrefixHandler = require("../client/PrefixHandler");

/**
 * @type Map<String,ExtendedClient>
 */
const clients = new Map();

/**
 * @type Map<String,ExtendedClient>
 */
const nclients = new Map();

class ExtendedClient extends Discord.Client {

  is_extended = true;

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
   * @param {Object} [p0.djsOptions] - Optional additional options for the default discord.js client.
   * @param {["eval", "help", "vca", "games", "points"]} p0.expansions.enable - List of expansions to enable.
   */ 
  constructor({
    intents = bot_intents,
    privilegedIntents = false,
    name = "Discord Bot",
    presences = undefined,
    logs = false,
    prefix = "/",
    port = process.env.PORT,
    twitch = 'https://twitch.tv/cannicide',
    autoInitialize = undefined,
    presenceDuration = 10,
    authors = [],
    description = undefined,
    expansions = {},
    djsOptions = {}
  }) {

    super((() => {
      //Initialize Discord.js extension before client construction
      new DiscordExtender();
      djsOptions.intents = privilegedIntents ? intents.concat(priv_intents) : intents;
      if (!djsOptions.partials) djsOptions.partials = [];
      if (!djsOptions.partials.includes("CHANNEL")) djsOptions.partials.push("CHANNEL"); //Allows receiving DMs
      return djsOptions;
    })());

    if (!listener) {
      app.use(express.static('public'));
      if (!port) throw new Error("Please specify a port to listen on when initializing your Elisif Client.");

      //Setup express server
      listener = app.listen(port, function() {
        console.log(`\n\n${name} listening on port ${listener.address().port}`);
      });
    }
    
    //Setup command handling methods
    this.commands = new CommandManager(this);

    //Setup bot information
    this.authors = authors;
    this.description = description;
    this.intents = intents;
    this.name = name;
    this.twitch = twitch;
    this.port = port;//listener.address().port;
    expansions.enable = expansions.enable ?? [];

    //Setup expansion methods
    this.expansions = new ExpansionManager(expansions);

    //Setup prefix methods
    this.prefix = new PrefixHandler(this);
    this.prefix.set(prefix);

    //Setup presence cycler method
    presences = presences ?? [`${this.prefix.get()}help`];
    this.PresenceCycler = new PresenceCycler(presences, presenceDuration, this);

    //Add debugging utility
    this.debug = (...loggings) => {
      if (arguments.length == 0) return this.settings.Global().get("debug_mode");
      if (this.settings.Global().get("debug_mode")) return console.log(...loggings);
    }

    //Assign this object to the name-client map
    nclients.set(name, this);

    //Setup ready event handler
    this.once("ready", () => {
      console.log(`${name} is up and running!\n\n`);

      //Assign this object to the ID-client map
      clients.set(this.user?.id, this);

      if (this.settings.Global().get("presence_cycler")) this.PresenceCycler.cycle(this.twitch);
      else this.user.setActivity(`${this.prefix.get()}help`, {type: 'STREAMING', url: this.twitch});

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
        Interpreter.initialize(this);

        //Auto initialize message event
        this.on("messageCreate", (message) => {

          try {

            // Avoid bot messages, DM and otherwise:
            if (message.author.bot) return false;

            //Handle command:
            var cmd = this.commands.handle(message);
    
            //Handle messages to be interpreted:
            if (!cmd) {
                // DM determination:
                if (message.guild === null) {
                    
                  //Interpret for DiscordSRZ code or other DM interpretation
                  Interpreter.dms.handle(message, message.content.split(" "));
      
                  return false;
                }
                else Interpreter.messages.handle(message, message.content.split(" "));
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

        //Elisif-simple compatible custom "slash command added" event
        this.on("@slashCommandAdded", (command) => {
          this.debug(`Slash command successfully loaded: ${command.name}`);
        });

        this.debug("Successfully auto-initialized command and interpreter handlers.");

      }

      this.refreshCache();

    });

    //Setup custom event handlers
    DiscordExtender.extendEvents(this);
    this.debug("Successfully extended discord.js events.");

  }

  /**
   * @return ExtendedClient
   */
  static get(identifier) {
    if (!identifier) throw new Error("Please specify an identifier for the Elisif Client you want to retrieve. The identifier can be either the ID of the client user, or the name of the bot as configured in the client options.");

    if (isNaN(identifier)) return nclients.get(identifier);
    return clients.get(identifier);
  }

  get util() {
    return Utility;
  }

  get settings() {
    //Global settings
    const Settings = require("../systems/settings");
    
    return new Settings(this);
  }

  setting(sett, val) {
    if (arguments.length == 0) return this.settings.Global();
    if (arguments.length == 1) return this.settings.Global().get(sett);
    if (arguments.length == 2) return this.settings.Global().set(sett, val);
  }

  authorNames() {
    return this.authors.map(author => author.username);
  }

  authorIds() {
    return this.authors.map(author => author.id);
  }

  async refreshCache() {

    if (!this.settings.Global().get("refresh_cache_on_boot")) return;
  
    var totalMessagesFetched = 0;
  
    for (var guild of client.guilds.cache.array()) {
  
      for (var channel of guild.channels.cache.filter(c => c.type == "text").array()) {
  
        var messages = await channel.messages.fetch();
        totalMessagesFetched += messages.size;
  
      }
  
    };
  
    console.log("Successfully fetched and cached " + totalMessagesFetched + " messages.");
  
  }

}

module.exports = class Handler {
  Client = ExtendedClient;
  express = app;
  Discord = Discord;
}