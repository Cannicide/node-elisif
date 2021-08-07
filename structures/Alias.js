/*
    Cannicide's Alias Class v2.0

    Completely rewritten to eliminate the major redundancies of the old alias
    system. Also updated to better follow object-orientation, by extending the
    Command class itself.
*/

const Command = require('../structures/Command');
const CommandManager = require('../managers/CommandManager');

/**
 * Creates an alias of an existent command.
 * @param {String} alias - Name of the alias
 * @param {String} original - Name of the original
 */
 class Alias extends Command {
    constructor(alias, original) {
      super((() => {
        var origcmd = CommandManager.get(original);
        if (!origcmd) throw new Error(`Cannot create an alias for the nonexistent command: ${original}.\nCommand: ${origcmd}`);
        var options = origcmd.options;
    
        options.name = alias;
        options.desc = `Alias of the \`/${origcmd.name}\` command.`;
        options.aliases = [];
        options.is_alias = true;
        options.execute = options.method;
        options.initialize = options.initializeMethod;
    
        return options;
      })());

      //Add this alias name to the original command's aliases list
      CommandManager.get(original).aliases.add(alias);

      //Add the original command's name to this alias' aliases list
      this.aliases.add(original);

      //Add this Command object to the aliases collection
      CommandManager.aliases.add(this);
  
    }
}

module.exports = Alias;