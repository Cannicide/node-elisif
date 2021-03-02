//A non-command system to interpret messages that are not commands and auto-respond/auto-react if necessary

var evg = require("./evg");

class Interpreter {
  constructor() {

    var Reactions = evg.remodel("reactions");
    const interpreters = {
      message: [],
      dm: [],
      reaction: []
    };

    /**
     * Interprets a guild message. Formerly named 'interpret()'.
     */
    this.handleMessage = (message, args) => {
      //Message interpreter format:
      /*
        {
          filter: function(message, args),
          response: function(message, args)
        }
      */

      var intp = interpreters.message.find(elem => elem.filter(message, args));

      if (intp)
        intp.response(message, args);

    };

    /**
     * Interprets a DM (direct message). Formerly named 'interpretDM()'.
     */
    this.handleDm = (message, args) => {
      //DM interpreter format:
      /*
        {
          filter: function(message, args),
          response: function(message, args)
        }
      */

      var intp = interpreters.dm.find(elem => elem.filter(message, args));

      if (intp)
        intp.response(message, args);

    };

    /**
     * Inteprets a reaction. Formerly named 'interpretReaction()'.
     */
    this.handleReaction = (reaction, user, isAdding) => {

      if (user.bot)
        return;

      var message = reaction.message;
      var emote = reaction.emoji.name;
      var emoteID = reaction.emoji.id;

      var inCache = Reactions.find(entry => (entry.name == emote || entry.id == emoteID || (Array.isArray(entry.name) && entry.name.includes(emote)) || (Array.isArray(entry.id) && entry.id.includes(emoteID))) && entry.messageID == message.id);

      //The given message is not to be interpreted by the interpreter if not stored as such
      if (!inCache)
        return;

      //Reaction interpreter format:
      /*
        {
          filter: function(reactionInterpreter, isAddingReaction),
          response: function(reaction, user)
        }
      */
      var intp = interpreters.reaction.find(elem => elem.filter(inCache, isAdding));

      if (intp)
        intp.response(reaction, user);

    };

    /**
     * Registers interpreters of any specified type.
     * @param {Object} options - All options for the interpreter to register.
     * @param {String} options.type - The type of interpreter (message/dm/reaction) to register.
     * @param {Function} options.filter - A function that accepts (args) for messages/dms or (reactionInterpreter, isAdding) for reactions; and checks whether or not the input should be responded to.
     * @param {Function} options.response - A function that accepts (message, args) for messages/dms or (reaction, user) for reactions; and uses these parameters to respond to an interpreted input that passes the filter check.
     */
    this.register = ({ type, filter, response }) => {

      var intp = {
        filter: filter,
        response: response
      };

      type = type.toLowerCase();
      if (type.endsWith("s"))
        type = type.slice(0, type.length - 1);

      interpreters[type].push(intp);

      return this;

    };

    /**
     * Adds an interpretable reaction to the database.
     */
    this.addReaction = (emojis, obj) => {

      if (!emojis) {
        //Catch case in which no emojis provided
      }
      else if (Array.isArray(emojis)) {
        //Multiple emojis
        obj.name = obj.name || [];
        obj.id = obj.id || [];

        emojis.forEach(emote => {
          if (isNaN(emote)) {
            obj.name.push(emote);
          }
          else
            obj.id.push(emote);
        });

      }
      else {
        //One emoji
        if (isNaN(emojis))
          obj.name = obj.name || emojis;
        else
          obj.id = obj.id || emojis;

      }

      Reactions.push(obj);

      return this;
    };

    /**
     * Returns a ReactionInterpreter object with utility methods to manipulate Reaction Interpreter data.
     *
     * @param {*} type - The type or category of the Reaction Interpreter
     */
    this.getReactionInterpreter = (type) => new ReactionInterpreter(type, this);

    /**
     * Initializes all Interpreters. Formerly named 'fetchReactionInterpreters()'.
     */
    this.initialize = (client) => {
      //Initialize Reaction Interpreters

      var cache = Reactions.values();

      cache.forEach(entry => {
        //Fetch and cache all messages that need their reactions interpreted
        client.channels.fetch(entry.channelID).then(channel => {
          channel.messages.fetch(entry.messageID, true);
        });
      });

    };

  }
}

class ReactionInterpreter {
  /**
   * A class representing a Reaction Interpreter, containing various utility methods to interact with Reaction Interpreter data.
   * 
   * @param {String} type - The specific type or category of the Reaction Interpreter
   * @param {Interface} Interpreter - The Interpreter object for this bot
  */
  constructor(type, Interpreter) {

    var Reactions = evg.resolve("reactions");

    var utilities = {

      type: type,

      /**
       * 
       * @param {Object} message - The Discord message object to create the Reaction Interpreter on
       * @param {Object} user - The user that created the Reaction Interpreter
       * @param {String[]} emotes - An array of emotes for the Reaction Interpreter to interpret
       * @param {Object} [customProperties] - Custom properties for the Reaction Interpreter in the format: {"property": "value"}
       */
      add: (message, user, emotes, customProperties) => {

        var item = {
            name: [],
            id: [],
            type: type,
            messageID: message.id,
            channelID: message.channel.id,
            starter: user.id
        };

        emotes.forEach(emote => {

          if (isNaN(emote)) item.name.push(emote);
          else item.id.push(emote);

        });

        Object.keys(customProperties).forEach(key => {

          item[key] = customProperties[key];

        });

        Interpreter.addReaction(emotes, item);

        return true;

      },
      remove: (sorted_index) => {
          var index = utilities.findIndex(sorted_index);
          Reactions.splice(index, 1);
      },
      array: () => {
          var list = Reactions.filter(item => item.type == type);
          return list;
      },
      fetch: (sorted_index) => {
          var sorted = utilities.array();
          return sorted[sorted_index];
      },
      findIndex: (sorted_index) => {
          var messageID = utilities.fetch(sorted_index).messageID;
          var index = Reactions.values().findIndex(item => item.messageID == messageID && item.type == type);
          return index;
      },
      findSortedIndex: (messageID) => {
          var sorted = utilities.array();
          return sorted.findIndex(item => item.messageID == messageID);
      }
    }

    Object.keys(utilities).forEach(utility => {

      this[utility] = utilities[utility];

    });

  }
}

module.exports = new Interpreter();