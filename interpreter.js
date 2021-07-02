//A non-command system to interpret messages that are not commands and auto-respond/auto-react if necessary

var evg = require("./evg");

class ReactionInterpreter {
  /**
   * A class representing a Reaction Interpreter, containing various utility methods to interact with Reaction Interpreter data.
   * 
   * @param {String} type - The specific type or category of the Reaction Interpreter
  */
  constructor(type) {

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

        __intp.addReaction(emotes, item);

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
      },
      /**
       * Registers a reaction interpreter.
       * @param {Object} options - Filtering and response options for reaction interpreters.
       * @param {Function} options.filter - A function that accepts (reactionInterpreter, isAdding) to check whether or not the input should be responded to.
       * @param {Function} options.response - A function that accepts (reaction, user) to respond to an interpreted input that passes the filter check.
       */
      register: ({filter, response}) => {

        __intp.register({
          type: "reactions",
          filter: filter,
          response: response
        });

      }
    }

    Object.keys(utilities).forEach(utility => {

      this[utility] = utilities[utility];

    });

  }
}

class ButtonInterpreter {

  /**
   * A class representing a Button Interpreter, containing various utility methods to interact with Button Interpreter data.
   * 
   * @param {String} type - The specific type or category of the Button Interpreter
  */
   constructor(type) {

    var Buttons = evg.resolve("buttons");

    var utilities = {

      type: type,

      /**
       * 
       * @param {Object} message - The Discord message object to create the Button Interpreter on
       * @param {Object} user - The user that created the Button Interpreter
       * @param {Object} [customProperties] - Custom properties for the Button Interpreter in the format: {"property": "value"}
       */
      add: (message, user, customProperties) => {

        var item = {
            id: message.buttons.get().map(v => v.id),
            type: type,
            messageID: message.id,
            channelID: message.channel.id,
            starter: user.id
        };

        // emotes.forEach(emote => {

        //   if (isNaN(emote)) item.name.push(emote);
        //   else item.id.push(emote);

        // });

        Object.keys(customProperties).forEach(key => {

          item[key] = customProperties[key];

        });

        __intp.addButton(message.buttons.get(), item);

        return true;

      },
      remove: (sorted_index) => {
          var index = utilities.findIndex(sorted_index);
          Buttons.splice(index, 1);
      },
      array: () => {
          var list = Buttons.filter(item => item.type == type);
          return list;
      },
      fetch: (sorted_index) => {
          var sorted = utilities.array();
          return sorted[sorted_index];
      },
      findIndex: (sorted_index) => {
          var messageID = utilities.fetch(sorted_index).messageID;
          var index = Buttons.values().findIndex(item => item.messageID == messageID && item.type == type);
          return index;
      },
      findSortedIndex: (messageID) => {
          var sorted = utilities.array();
          return sorted.findIndex(item => item.messageID == messageID);
      },
      /**
       * Registers a button interpreter.
       * @param {Object} options - Filtering and response options for reaction interpreters.
       * @param {Function} options.filter - A function that accepts (cachedButton) to check whether or not the input should be responded to.
       * @param {Function} options.response - A function that accepts (button = BtnMessageComponent) to respond to an interpreted input that passes the filter check.
       */
      register: ({filter, response}) => {

        __intp.register({
          type: "buttons",
          filter: filter,
          response: response
        });

      }
    }

    Object.keys(utilities).forEach(utility => {

      this[utility] = utilities[utility];

    });

  }

}

class MessageInterpreter {

  #filter;
  #response;

  /**
     * Creates and registers a new message interpreter.
     * @param {Object} options - All registration options for the message interpreter.
     * @param {Function} options.filter - A function that accepts (message, args) for messages/dms to check whether or not the input should be responded to.
     * @param {Function} options.response - A function that accepts (message, args) for messages/dms to respond to an interpreted input that passes the filter check.
     * @param {boolean} options.DMs - Whether or not this message interpreter should be a DM interpreter.
     */
  constructor({filter, response, DMs}) {

    var type = DMs ? 'dms' : 'message';

    __intp.register({
      type: type,
      filter: filter,
      response: response
    });

    this.#filter = filter;
    this.#response = response;

  }

  passesFilter(message, args) {
    return this.#filter(message, args);
  }

  simulateResponse(message, args) {
    return this.#response(message, args);
  }

  getFilter() {
    return this.#filter;
  }

  getResponse() {
    return this.#response;
  }

}

class Interpreter {
  constructor() {

    var Reactions = evg.remodel("reactions");
    var Buttons = evg.remodel("buttons");

    const interpreters = {
      message: [],
      dm: [],
      reaction: [],
      button: []
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
     * Inteprets button clicks.
     */
     this.handleButton = (button) => {

      var message = button.message;
      var id = button.id;

      var inCache = Buttons.find(entry => (entry.id == id || (Array.isArray(entry.id) && entry.id.includes(id))) && entry.messageID == message.id);

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
      var intp = interpreters.button.find(elem => elem.filter(inCache));

      if (intp)
        intp.response(button);

    };

    /**
     * Registers interpreters of any specified type.
     * @param {Object} options - All options for the interpreter to register.
     * @param {String} options.type - The type of interpreter (message/dm/reaction) to register.
     * @param {Function} options.filter - A function that accepts (message, args) for messages/dms or (reactionInterpreter, isAdding) for reactions or (cachedButton) for buttons; and checks whether or not the input should be responded to.
     * @param {Function} options.response - A function that accepts (message, args) for messages/dms or (reaction, user) for reactions or (button = BtnMessageComponent) for buttons; and uses these parameters to respond to an interpreted input that passes the filter check.
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
     * Adds an interpretable button(s) to the database. It is recommended to use ButtonLode instead.
     * @param {BtnMessageComponent|BtnMessageComponent[]} button - A BtnMessageComponent representing the interpretable button(s) to add to the database.
     * @param {Object} obj - Data affiliated with this specific ButtonInterpreter to save in the database.
     * @param {String} obj.type - The unique class or type of ButtonInterpreter this is (e.g. "pollbuttons")
     * @param {String} obj.messageID - The ID of the message to interpret reactions on.
     * @param {String} obj.channelID - The ID of the channel containing the message to interpret reactions on.
     */
    this.addButton = (button, obj) => {

      if (!button) {
        //Catch case in which no buttons provided
      }
      else if (Array.isArray(button)) {
        //Multiple buttons
        obj.id = [];

        button.forEach(btn => {
          obj.id.push(btn.id);
        });

      }
      else {
        //One button
          obj.id = button.id;

      }

      Buttons.push(obj);

      return this;

    }

    /**
     * Adds an interpretable reaction(s) to the database. It is recommended to use ReactionLode instead.
     * @param {String|String[]} emojis - The emoji or array of interpretable emojis to add to the database.
     * @param {Object} obj - Data affiliated with this ReactionInterpreter to save in the database.
     * @param {String} obj.type - The unique class or type of ReactionInterpreter this is (e.g. "reactionroles")
     * @param {String} obj.messageID - The ID of the message to interpret reactions on.
     * @param {String} obj.channelID - The ID of the channel containing the message to interpret reactions on.
     * @param {String|String[]} [obj.name] - The names of the emojis to interpret, for default Discord or text emotes.
     * @param {String|String[]} [obj.id] - The IDs of the emojis to interpret, for custom and animated emotes.
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
     * Returns a ReactionInterpreter object with simplified methods and utilities for reaction data manipulation.
     * Used for: Reaction interpreters.
     */
    this.ReactionLode = ReactionInterpreter;

    /**
     * Returns a MessageInterpreter object with simplified methods and utilities for message interpretation.
     * Used for: Message interpreters, DM interpreters.
     */
    this.MessageLode = MessageInterpreter;

    /**
     * Returns a ButtonInterpreter object with simplified methods and utilities for button click interpretation.
     * Used for: Button click interpreters.
     */
    this.ButtonLode = ButtonInterpreter;

    /**
     * Initializes all Interpreters. Formerly named 'fetchReactionInterpreters()'.
     */
    this.initialize = (client) => {
      //Initialize Reaction Interpreters

      var cache = Reactions.values();
      var buttonCache = Buttons.values();

      var refetch = entry => {
        //Fetch and cache all messages that need their reactions/buttons interpreted
        client.channels.fetch(entry.channelID).then(channel => {
          channel.messages.fetch(entry.messageID, true);
        });
      };

      cache.forEach(refetch);
      buttonCache.forEach(refetch);

    };

  }
}

const __intp = new Interpreter();

module.exports = __intp;