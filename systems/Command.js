//Cannicide's Command Class v2.0
//Now includes simplified constructor, command cooldown, alias options, channel restrictions, and DM-only commands.

const aliasCache = require("./aliases");

var commands = [];
const channelCommandMap = {};

/**
 * Creates an alias of an existent command.
 * @param {String} alias - Name of the alias
 * @param {String} original - Name of the original
 */
class Alias {
  constructor(alias, original) {
    var list = new Command(false, {}).getCommands();
    var origcmd = list.find(c => c.name == original).cmd;
    var options = origcmd.getOptions();

    options.desc = `Alias of the \`/${origcmd.getName()}\` command.`;
    options.aliases = [];
    options.isalias = true;

    var aliascmd = new Command(alias, options, options.method);

    this.getAsCommand = () => {
      return aliascmd;
    };

    origcmd.pushAlias(alias);
    aliascmd.pushAlias(original);

  }
}

class Command {

  static get channelCommandMap() {return channelCommandMap;}

  static get commands() {return commands;}

 /**
  * Creates a new executable Command that can be called by users and run by the bot.
  * @param {String} name - The name of the command, used to call the command and identify it in the help command.
  * @param {function(Object, String[]):void} method - The method that is executed when the command is called. Has parameters (message, args).
  * @param {Object} options - Command options.
  * @param {String[]} [options.perms] - Any Discord permissions required to run the command.
  * @param {String[]} [options.roles] - Any Discord roles required to run the command.
  * @param {Boolean} [options.invisible] - Whether or not the command will not be shown in the help command menu. Intended for moderator commands or easter eggs.
  * @param {String} [options.desc] - Optional description of the command.
  * @param {Boolean} [options.dm_only] - Set command as DM-only.
  * @param {Number} [options.cooldown] - Set a cooldown on the command, in seconds.
  * @param {String[]} [options.aliases] - Specify command aliases.
  * @param {String[]} [options.channels] - Specify channel names/IDs to restrict this command to.
  * @param {Boolean} [options.isalias] - Whether or not this command is an alias
  * @param {Object[]} [options.args] - A list of the possible command arguments of a command.
  * @param {String} options.args[].name - The name of the argument.
  * @param {Boolean} [options.args[].optional] - Whether or not the argument is optional. Default is false.
  * @param {String} [options.args[].feedback] - Feedback to send if the argument is mandatory and not provided by the user. If unspecified or false, a default feedback is sent. If set as "none", no feedback except the help message is sent. If set as an embed, the first embed feedback in the arg list will be sent as the only feedback.
  * @param {Boolean} [options.args[].static] - Whether or not the argument is a static and constant word, for documentation purposes.
  * @param {Boolean} [options.args[].flag] - Whether or not this argument is a flag, for documentation purposes.
  */
  constructor(name, { perms = false, roles = false, invisible = false, desc = "", dm_only = false, cooldown = false, aliases = false, channels = false, isalias = false, args = false }, method) {
    var message = false;
    var timestamps = [];
    var flags = false;

    aliases = aliases || [];
    channels = channels || [];

    const client = require("../index").Client.getInstance();

    //Add default, bot-specific alias
    if (name && method && !isalias)
      aliases.push(`${client.name ? client.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "elisif"}:` + name);

    //Add restricted channel if non-existent
    channels.forEach(channel => {
      if (!(channel in channelCommandMap))
        channelCommandMap[channel] = [];

      //Add command to channel-command map
      channelCommandMap[channel].push(name);
    });

    (args || []).filter(arg => arg.flag).forEach(flag => {

      //Set flags to an array if existent
      if (!flags)
        flags = [];

      //Add to flags array
      flags.push({
        name: "-" + flag.name,
        desc: flag.flag
      });

      //All flags are optional
      flag.optional = true;
    });

    this.set = function (msg, pfix) {
      message = msg;
    };

    this.getCommands = () => {
      return commands;
    };

    this.getName = () => {
      return name;
    };

    this.getArguments = () => {
      if (!args)
        return false;
      else {
        return args;
      }
    };

    this.getAliases = () => {
      return aliases;
    };

    this.pushAlias = (aliasName) => {
      if (!aliases.includes(aliasName))
        aliases.push(aliasName);
    };

    this.getOptions = () => {

      return { method: method, perms: perms, roles: roles, invisible: invisible, desc: desc, dm_only: dm_only, cooldown: cooldown, channels: channels, aliases: aliases, args: args, name: name, flags: flags };
    };

    /**
     * Check if this command or any of its aliases have the name given.
     * @param {String} cmd
     * @returns {boolean}
     */
    this.matches = (cmd) => {
      var matched = false;

      if (name == cmd)
        matched = true;

      aliases.forEach((item) => {
        if (item.getName() == cmd)
          matched = true;
      });

      return matched;
    };

    function CatchPromise(err) {
      this.catch = function (errorMethod) {
        if (err)
          errorMethod(err);
      };
    }

    this.execute = function (userArgs) {
      var error = false;
      var foundFlags = false;

      if (userArgs && flags) {
        //Find flags in message, remove them from args
        foundFlags = [];
        userArgs.forEach((arg, index) => {
          var flag = flags.find(flag => flag.name.toLowerCase() == arg.toLowerCase());

          if (flag) {
            foundFlags.push(flag.name);
            userArgs.splice(index, 1);
            if (userArgs.length == 0)
              userArgs = false;
          }
        });

      }

      var mandatoryArgs = args ? args.filter(arg => !arg.optional) : [];

      //Establish cooldown times
      const now = Date.now();
      const cooldownAmount = (cooldown || 0) * 1000;
      const userTimestamp = timestamps[message.author.id] || (now - cooldownAmount);
      const expirationTime = userTimestamp + cooldownAmount;
      const timeLeft = (expirationTime - now) / 1000;
      const lastUseTimePassed = (now - userTimestamp) / 1000;

      if (!message) {
        error = "No message was detected.";
        console.error("No message was detected by Command execution; this is an impossible occurrence and has resulted in a fatal error.");
      }
      else if (dm_only && message.guild) {
        //Is DM-only but the message isn't a DM
        error = "Sorry, that command only works in DMs.";
      }
      else if (!dm_only && !message.guild) {
        //Isn't DM-only but message is a DM
        error = "Sorry, that command can't be used in DMs.";
      }
      else if (channels.length >= 1 && !(channels.includes(message.channel.id) || channels.includes(message.channel.name))) {
        //The command can only be used in the 'channels' channels, and this channel isn't one of them.
        error = "Sorry, that command cannot be used in this channel.";
      }
      else if (now < expirationTime) {
        //Command is in cooldown
        error = `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${name}\` command.`;
      }
      else if ((mandatoryArgs.length > 0 && !userArgs) || userArgs.length < mandatoryArgs.length) {
        //The user has specified less args than are mandatory
        var missedArgs = mandatoryArgs.slice(userArgs.length);
        error = "";

        missedArgs.forEach(arg => {
          var feedback = arg.feedback || `Please specify the command argument: \`${arg.name}\`.`;
          if (feedback != "none" && typeof error == "string")
            error += feedback + "\n";

          //Allow attaching Embed feedback.
          if (typeof feedback == "object")
            error = feedback;
        });

        if (typeof error == "string")
          error += `\nReview the syntax for this command with \`/help ${name}\`.`;
      }
      else {

        //Extended message and channel objects
        var advMessage = message;

        advMessage.setValidFlags(flags);
        advMessage.setCooldownLeft(timeLeft);
        advMessage.setSinceLastUse(lastUseTimePassed);

        if ((!perms && !roles) || dm_only) {
          //method(advMessage, userArgs); - Deprecated
          method(advMessage);
        }
        else {
          var member = message.member;
          var hasPermissions = true;
          var hasRoles = false;

          if (perms) {
            perms.forEach((item) => {
              item = item.toUpperCase();
              if (!member.hasPermission(item)) {
                hasPermissions = false;
              }
            });
          }
          if (roles) {
            roles.forEach((item) => {
              if (member.roles.cache.find(x => x.name == item)) {
                hasRoles = true;
              }
            });
          }
          else {
            hasRoles = true;
          }

          if (hasPermissions && hasRoles) {
            //method(advMessage, userArgs); - Deprecated
            method(advMessage);
          }
          else {
            error = "Sorry, you do not have perms to execute that command.";
          }
        }

      }

      if ((!error && message.author.id in timestamps) || !(message.author.id in timestamps)) {
        //Set new command cooldown
        timestamps[message.author.id] = now;
        setTimeout(() => delete timestamps[message.author.id], cooldownAmount);
      }

      return new CatchPromise(error);
    };

    if (name && method)
      commands.push({ name: name, cmd: this, special: invisible, desc: desc, dm_only: dm_only, cooldown: cooldown, channels: channels, aliases: aliases, isalias: isalias, perms: perms, roles: roles, flags: flags, args: args });

    if (name && method && !isalias)
      aliases.forEach(alias => {
        aliasCache.addAlias(new Alias(alias, name));
      });

  }
}

module.exports = Command;