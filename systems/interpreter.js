// Cannicide's Input Interpreter v3.0
//A system to interpret messages, DMs, reactions, and buttons that are not commands and auto-respond/auto-react if necessary

var evg = require("./evg");

class ReactionInterpreter {
  /**
   * A class representing a Reaction Interpreter, containing various utility methods to interact with Reaction Interpreter data.
   * 
   * @param {String} category - The specific type or category of the Reaction Interpreter
  */
  constructor(category) {

    var Reactions = evg.dynamic("reactions");

    var utilities = {

      category: category,

      /**
       * 
       * @param {Object} message - The Discord message object to create the Reaction Interpreter on
       * @param {Object} user - The user that created the Reaction Interpreter
       * @param {String[]} emotes - An array of emotes for the Reaction Interpreter to interpret
       * @param {Object} [customProperties] - Custom properties for the Reaction Interpreter in the format: {"property": "value"}
       */
      add: (message, user, emotes, customProperties = {}) => {

        var item = {
            name: [],
            id: [],
            category: category,
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
      removeByID: (messageID) => {
        return utilities.remove(utilities.findSortedIndex(messageID));
      },
      flush: () => {
        return Reactions.clear();
      },
      array: () => {
          var list = Reactions.filter(item => item.category == category);
          return list;
      },
      fetch: (sorted_index) => {
          var sorted = utilities.array();
          return sorted[sorted_index];
      },
      findIndex: (sorted_index) => {
          var messageID = utilities.fetch(sorted_index).messageID;
          var index = Reactions.values().findIndex(item => item.messageID == messageID && item.category == category);
          return index;
      },
      findSortedIndex: (messageID) => {
          var sorted = utilities.array();
          return sorted.findIndex(item => item.messageID == messageID);
      },
      /**
       * Registers a reaction interpreter.
       * @param {Object} options - Filtering and response options for reaction interpreters.
       * @param {(cachedReactionEntry:Object, reaction:MessageReaction, user:User) => boolean} options.filter - A function that accepts (cachedReactionEntry, reaction, user) to check whether or not the input should be responded to.
       * @param {(reaction:MessageReaction, user:User) => void} options.response - A function that accepts (reaction, user) to respond to an interpreted input that passes the filter check.
       * @param {boolean} options.adding - Defines whether to handle the reaction being added or removed.
       */
      register: ({filter, response, adding}) => {

        __intp.register({
          type: "reactions",
          filter,
          response,
          adding,
          category,
          lode: {
            type: "reactions",
            filter,
            response,
            adding,
            category,
            passesFilter(reactionEntry, reaction, user) {
              return filter(reactionEntry, reaction, user);
            },
          
            simulateResponse(reaction, user) {
              return response(reaction, user);
            },

            add: utilities.add,
            remove: utilities.remove,
            removeByID: utilities.removeByID,
            array: utilities.array,
            fetch: utilities.fetch,
            findIndex: utilities.findIndex,
            findSortedIndex: utilities.findSortedIndex
          }
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
   * @param {String} category - The specific type or category of the Button Interpreter
  */
   constructor(category) {

    var Buttons = evg.dynamic("buttons");

    var utilities = {

      category: category,

      /**
       * 
       * @param {Object} message - The Discord message object to create the Button Interpreter on
       * @param {Object} user - The user that created the Button Interpreter
       * @param {Object} [customProperties] - Custom properties for the Button Interpreter in the format: {"property": "value"}
       */
      add: (message, user, customProperties = {}) => {

        var item = {
            id: message.buttons.get().map(v => v.id),
            category: category,
            messageID: message.id,
            channelID: message.channel.id,
            starter: user.id
        };

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
      removeByID: (messageID) => {
        return utilities.remove(utilities.findSortedIndex(messageID));
      },
      flush: () => {
        return Buttons.clear();
      },
      array: () => {
          var list = Buttons.filter(item => item.category == category);
          return list;
      },
      fetch: (sorted_index) => {
          var sorted = utilities.array();
          return sorted[sorted_index];
      },
      findIndex: (sorted_index) => {
          var messageID = utilities.fetch(sorted_index).messageID;
          var index = Buttons.values().findIndex(item => item.messageID == messageID && item.category == category);
          return index;
      },
      findSortedIndex: (messageID) => {
          var sorted = utilities.array();
          return sorted.findIndex(item => item.messageID == messageID);
      },
      /**
       * Registers a button interpreter.
       * @param {Object} options - Filtering and response options for reaction interpreters.
       * @param {(cachedButton:Object, button:BtnMessageComponent) => boolean} options.filter - A function that accepts (cachedButtonEntry, button) to check whether or not the input should be responded to.
       * @param {(button:BtnMessageComponent) => void} options.response - A function that accepts (button:BtnMessageComponent) to respond to an interpreted input that passes the filter check.
       */
      register: ({filter, response}) => {

        __intp.register({
          type: "buttons",
          filter,
          response,
          category,
          lode: {
            type: "buttons",
            filter,
            response,
            category,
            passesFilter(buttonEntry, button) {
              return filter(buttonEntry, button);
            },
          
            simulateResponse(button) {
              return response(button);
            },

            add: utilities.add,
            remove: utilities.remove,
            removeByID: utilities.removeByID,
            array: utilities.array,
            fetch: utilities.fetch,
            findIndex: utilities.findIndex,
            findSortedIndex: utilities.findSortedIndex
          }
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

    this.type = DMs ? 'dms' : 'message';
    this.#filter = filter;
    this.#response = response;
    this.lode = this;

    __intp.register(this);

  }

  passesFilter(message, args) {
    return this.#filter(message, args);
  }

  simulateResponse(message, args) {
    return this.#response(message, args);
  }

  get filter() {
    return this.#filter;
  }

  get response() {
    return this.#response;
  }

}

class DeprecatedInterpreter {

  deprecated = true;

  constructor() {

    const interpreters = {
      message: [],
      dm: [],
      reaction: [],
      button: []
    };

    this.getInterpreters = () => interpreters;

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

      var Reactions = evg.dynamic("reactions");

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
          filter: function(cachedReactionEntry, reaction, user),
          response: function(reaction, user),
          category: "type of reaction interpreter",
          adding: <boolean> //Whether reaction is being added or removed
        }
      */
      var intp = interpreters.reaction.find(elem => elem.filter(inCache, reaction, user) && elem.category == inCache.category && elem.adding == isAdding);

      if (intp)
        intp.response(reaction, user);

    };

    /**
     * Inteprets button clicks.
     */
     this.handleButton = (button) => {

      var Buttons = evg.dynamic("buttons");

      var message = button.message;
      var id = button.id;

      var inCache = Buttons.find(entry => (entry.id == id || (Array.isArray(entry.id) && entry.id.includes(id))) && entry.messageID == message.id);

      //The given message is not to be interpreted by the interpreter if not stored as such
      if (!inCache)
        return;

      //Button interpreter format:
      /*
        {
          filter: function(cachedButtonEntry, button),
          response: function(button),
          category: "type of button interpreter"
        }
      */
      var intp = interpreters.button.find(elem => elem.filter(inCache, button) && elem.category == inCache.category);

      if (intp)
        intp.response(button);

    };

    /**
     * Registers interpreters of any specified type.
     * @param {Object} options - All options for the interpreter to register.
     * @param {String} options.type - The type of interpreter (message/dm/reaction/button) to register.
     * @param {Function} options.filter - A function that accepts (message, args) for messages/dms or (cachedReactionEntry, reaction, user) for reactions or (cachedButtonEntry, button) for buttons; and checks whether or not the input should be responded to.
     * @param {Function} options.response - A function that accepts (message, args) for messages/dms or (reaction, user) for reactions or (button:BtnMessageComponent) for buttons; and uses these parameters to respond to an interpreted input that passes the filter check.
     * @param {String} [options.category] - The category of the reaction/button interpreter. Not applicable for messages or DMs.
     * @param {boolean} [options.adding] - For reaction interpreters, defines whether to handle the reaction being added or removed.
     */
    this.register = ({ type, filter, response, category, adding = true, lode }) => {

      var intp = {
        filter,
        response,
        lode
      };

      type = type.toLowerCase();
      if (type.endsWith("s"))
        type = type.slice(0, type.length - 1);

      if ((type == "reaction" || type == "button") && category) intp.category = category;
      if (type == "reaction") intp.adding = adding; 

      interpreters[type].push(intp);

      return this;

    };

    /**
     * Adds an interpretable button(s) to the database. It is recommended to use ButtonLode instead.
     * @param {BtnMessageComponent|BtnMessageComponent[]} button - A BtnMessageComponent representing the interpretable button(s) to add to the database.
     * @param {Object} obj - Data affiliated with this specific ButtonInterpreter to save in the database.
     * @param {String} obj.category - The unique class or type of ButtonInterpreter this is (e.g. "pollbuttons")
     * @param {String} obj.messageID - The ID of the message to interpret reactions on.
     * @param {String} obj.channelID - The ID of the channel containing the message to interpret reactions on.
     */
    this.addButton = (button, obj) => {

      var Buttons = evg.dynamic("buttons");

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
     * @param {String} obj.category - The unique category of ReactionInterpreter this is (e.g. "reactionroles")
     * @param {String} obj.messageID - The ID of the message to interpret reactions on.
     * @param {String} obj.channelID - The ID of the channel containing the message to interpret reactions on.
     * @param {String|String[]} [obj.name] - The names of the emojis to interpret, for default Discord or text emotes.
     * @param {String|String[]} [obj.id] - The IDs of the emojis to interpret, for custom and animated emotes.
     */
    this.addReaction = (emojis, obj) => {

      var Reactions = evg.dynamic("reactions");

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
      //Initialize Reaction/Button Interpreters

      var Reactions = evg.dynamic("reactions");
      var Buttons = evg.dynamic("buttons");

      var cache = Reactions.values();
      var buttonCache = Buttons.values();

      //Method to remove all interpreters in channels/messages that no longer exist
      var catcher = (err, entry) => {
        if (err.httpStatus == 404) {
          //Channel/message of reaction/button not found
          var reactIndex = cache.findIndex(e => e.channelID == entry.channelID && e.messageID == entry.messageID);
          var btnIndex = buttonCache.findIndex(e => e.channelID == entry.channelID && e.messageID == entry.messageID);

          //Remove interpreters with matching channel/message ids from the respective caches
          if (reactIndex > -1) Reactions.splice(reactIndex);
          if (btnIndex > -1) Buttons.splice(btnIndex);
        }
        else console.error(err);
      }

      //Method to fetch all channels and messages containing reaction/button interpreters
      var refetch = entry => {
        //Fetch and cache all messages that need their reactions/buttons interpreted
        client.channels.fetch(entry.channelID).then(channel => {
          channel.messages.fetch(entry.messageID, true).catch(err => catcher(err, entry));
        }).catch(err => catcher(err, entry));
      };

      //Execute refetch and catcher on all interpreters in the reaction and button caches
      cache.forEach(refetch);
      buttonCache.forEach(refetch);

    };

  }
}

class Interpreter {

  #messages = {};

  constructor() {
    this.__intp = __intp;
  }

  get interpreters() {
    return this.__intp.getInterpreters();
  }

  get messages() {

    var MessageLode = this.__intp.MessageLode;

    return {
      /**
       * Interprets a guild message, responding if a registered interpreter's filter conditions are met.
       */
      handle: this.__intp.handleMessage,
      /**
       * Registers a message interpreter, with the provided filter, response, and an optional identifier to get the interpreter again.
       * @param {Object} options
       * @param {(message:AdvancedMessage, args:string[]) => boolean} options.filter - A function that returns true if the message should be interpreted.
       * @param {(message:AdvancedMessage, args:string[]) => void} options.response - A function that interprets/responds to the message if it passes the filter.
       * @param {String} [options.identifier] - An optional identifier; for retrieving the message interpreter later with `Interpreter.messages.get()`.
       */
      register: ({filter, response, identifier}) => {
        var messageInterpreter = new MessageLode({
          filter, response, DMs: false
        });

        if (identifier && isNaN(identifier)) this.#messages[identifier] = messageInterpreter;

        return messageInterpreter;
      },
      /**
       * Gets a registered message interpreter, if it was registered with an optional identifier.
       * @param {String} identifier - The identifier of the message interpreter.
       * @returns {MessageInterpreter} MessageInterpreter
       */
      get: (identifier) => this.#messages[identifier] || null, 
      /**
       * Returns an array of all currently active MessageInterpreters.
       * @returns {MessageInterpreter[]} Array of MessageInterpreters
       */
      list: () => {
        return this.interpreters.message.map(i => i.lode ? i.lode : i);
      }
    }
  }

  get dms() {

    var MessageLode = this.__intp.MessageLode;

    return {
      /**
       * Interprets a direct message, responding if a registered interpreter's filter conditions are met.
       */
      handle: this.__intp.handleDm,
      /**
       * Registers a DM interpreter, with the provided filter, response, and an optional identifier to get the interpreter again.
       * @param {Object} options
       * @param {(message:AdvancedMessage, args:string[]) => boolean} options.filter - A function that returns true if the DM should be interpreted.
       * @param {(message:AdvancedMessage, args:string[]) => void} options.response - A function that interprets/responds to the DM if it passes the filter.
       * @param {String} [options.identifier] - An optional identifier; for retrieving the DM interpreter later with `Interpreter.dms.get()`.
       */
      register: ({filter, response, identifier}) => {
        var messageInterpreter = new MessageLode({
          filter, response, DMs: true
        });

        if (identifier) this.#messages[identifier] = messageInterpreter;

        return messageInterpreter;
      },
      /**
       * Gets a registered DM interpreter, if it was registered with an optional identifier.
       * @param {String} identifier - The identifier of the DM interpreter.
       * @returns {MessageInterpreter} MessageInterpreter for DMs
       */
      get: (identifier) => this.#messages[identifier] || null,  
      /**
       * Returns an array of all currently active DMInterpreters.
       * @returns {MessageInterpreter[]} Array of DMInterpreters
       */
      list: () => {
        return this.interpreters.dm.map(i => i.lode ? i.lode : i);
      }
    }

  }

  get reactions() {

    var ReactionLode = this.__intp.ReactionLode;

    return {
      /**
       * Interprets a reaction, responding if a registered interpreter's filter conditions are met.
       */
      handle: this.__intp.handleReaction,
      /**
       * Registers a reaction interpreter, with the provided filter, response, and an optional identifier to get the interpreter again.
       * @param {Object} options
       * @param {(cachedReactionEntry:Object, reaction:MessageReaction, user:User) => boolean} options.filter - A function that returns true if the reaction should be interpreted.
       * @param {(reaction:MessageReaction,user:User) => void} options.response - A function that interprets/responds to the reaction if it passes the filter.
       * @param {String} options.category - The category of the reaction interpreter.
       * @param {boolean} [options.adding] - Whether to interpret when the reaction is added or removed. True by default.
       */
      register: ({filter, response, category, adding = true}) => {
        var reactInterpreter = new ReactionLode(category);
        
        reactInterpreter.register({
          filter, response, adding: adding
        });

        return reactInterpreter;
      },
      /**
       * Gets the reaction interpreter with the specified category.
       * @param {String} category - The category of the reaction interpreter.
       * @returns {ReactionInterpreter} ReactionInterpreter
       */
      get: (category) => new ReactionLode(category), 
      /**
       * Returns an array of all currently active ReactionInterpreters.
       * @returns {ReactionInterpreter[]} Array of ReactionInterpreters
       */
      list: () => {
        return this.interpreters.reaction.map(i => i.lode ? i.lode : i);
      }
    }

  }

  get buttons() {

    var ButtonLode = this.__intp.ButtonLode;

    return {
      /**
       * Interprets a button click, responding if a registered interpreter's filter conditions are met.
       */
      handle: this.__intp.handleButton,
      /**
       * Registers a button interpreter, with the provided filter, response, and an optional identifier to get the interpreter again.
       * @param {Object} options
       * @param {(cachedButtonEntry:Object, button:BtnMessageComponent) => boolean} options.filter - A function that returns true if the button click should be interpreted.
       * @param {(button:BtnMessageComponent) => void} options.response - A function that interprets/responds to the button click if it passes the filter.
       * @param {String} options.category - The category of the button interpreter.
       */
      register: ({filter, response, category}) => {
        var btnInterpreter = new ButtonLode(category);
        
        btnInterpreter.register({
          filter, response
        });

        return btnInterpreter;
      },
      /**
       * Gets the button interpreter with the specified category.
       * @param {String} category - The category of the button interpreter.
       * @returns {ButtonInterpreter} ButtonInterpreter
       */
      get: (category) => new ButtonLode(category), 
      /**
       * Returns an array of all currently active ButtonInterpreters.
       * @returns {ButtonInterpreter[]} Array of ButtonInterpreters
       */
      list: () => {
        return this.interpreters.button.map(i => i.lode ? i.lode : i);
      }
    }

  }

  initialize(client) {
    this.__intp.initialize(client);
  }

  //////////////////////////////////////////////////////////////////////////////////////
  //                                                                                  //
  //  Identify fully deprecated methods and properties, return error for them below:  //
  //                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////

  /**
   * Fully deprecated method; no longer functional.
   * @deprecated Use one of `messages.register()`, `dms.register()`, `reactions.register()`, or `buttons.register()` instead.
   */
  register() {
    throw new Error("Interpreter.register() has been fully deprecated. Please use the latest means of registering interpreters instead.");
  }

  /**
   * Fully deprecated method; no longer functional.
   * @deprecated Use `messages.handle()` instead.
   */
  handleMessage() {
    throw new Error("Interpreter.handleMessage() has been fully deprecated. Please use `messages.handle()` instead.");
  }

  /**
   * Fully deprecated method; no longer functional.
   * @deprecated Use `dms.handle()` instead.
   */
  handleDm() {
    throw new Error("Interpreter.handleDm() has been fully deprecated. Please use `dms.handle()` instead.");
  }

  /**
   * Fully deprecated method; no longer functional.
   * @deprecated Use `reactions.handle()` instead.
   */
  handleReaction() {
    throw new Error("Interpreter.handleReaction() has been fully deprecated. Please use `reactions.handle()` instead.");
  }

  /**
   * Fully deprecated method; no longer functional.
   *  @deprecated Use `buttons.handle()` instead.
   */
  handleButton() {
    throw new Error("Interpreter.handleButton() has been fully deprecated. Please use `buttons.handle()` instead.");
  }

  /**
   * Fully deprecated method; no longer functional.
   * @deprecated Use `buttons.get(<category>).add()` instead.
   */
  addButton() {
    throw new Error("Interpreter.addButton() has been fully deprecated. Please use `buttons.get(<category>).add()` instead.");
  }

  /**
   * Fully deprecated method; no longer functional.
   * @deprecated Use `reactions.get(<category>).add()` instead.
   */
  addReaction() {
    throw new Error("Interpreter.addReaction() has been fully deprecated. Please use `reactions.get(<category>).add()` instead.");
  }

}

const __intp = new DeprecatedInterpreter();

module.exports = new Interpreter();