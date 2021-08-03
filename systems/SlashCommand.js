//Jay's SlashCommand class v1.0


const SlashManager = require("../managers/SlashManager");
const SlashInteraction = require("../structures/SlashInteraction");

/**
 * A class to create and manage executable Slash Commands.
 */
class SlashCommand {

    //Contains all SlashCommand objects, organized by command name
    static COMMANDS = {};

    //Currently not implemented: @param {Number} [options.cooldown] - Set a cooldown on the command, in seconds. 
    /**
     * Creates a new executable Slash Command that can be called by users and run by the bot.
     * @param {String} name - The name of the slash command, used to call the slash command and identify it in the help command.
     * @param {Object} options - Command options.
     * @param {String[]} [options.perms] - Any Discord permissions required to run the command.
     * @param {String[]} [options.roles] - Any Discord roles required to run the command.
     * @param {String} [options.desc] - Optional description of the command.
     * @param {String[]} [options.channels] - Specify channel names/IDs to restrict this command to.
     * @param {String[]} [options.guilds] - Specify guild IDs to restrict this command to.
     * @param {function(Object, String[]):void} method - The method that is executed when the command is called. Has parameters (message, args).
     * 
     * @param {Object[]} [options.args] - A list of the possible command arguments of a command.
     * @param {String} options.args[].name - The name of the argument.
     * @param {String} options.args[].desc - The description of the argument.
     * @param {String|Number} [options.args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
     * @param {String[]|Number[]} [options.args[].choices] - An optional set of static, defined choices/values for this argument.
     * @param {Boolean} [options.args[].optional] - Whether or not the argument is optional. Default is false.
     * @param {"sub"|"group"|"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].type - The datatype of the argument.
     * 
     * @param {Object[]} [options.args[].args] - A list of the possible subarguments of this subcommand, or subcommands of this subgroup, if applicable.
     * @param {String} options.args[].args[].name - The name of the argument or subcommand.
     * @param {String} options.args[].args[].desc - The description of the argument or subcommand.
     * @param {String|Number} [options.args[].args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
     * @param {String[]|Number[]} [options.args[].args[].choices] - An optional set of static, defined choices/values for this argument.
     * @param {Boolean} [options.args[].args[].optional] - Whether or not the argument is optional. Default is false.
     * @param {"sub"|"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].args[].type - The datatype of the argument.
     *
     * @param {Object[]} [options.args[].args[].args] - A list of the possible subarguments of this subcommand, if applicable.
     * @param {String} options.args[].args[].args[].name - The name of this argument.
     * @param {String} options.args[].args[].args[].desc - The description of this argument.
     * @param {String|Number} [options.args[].args[].args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
     * @param {String[]|Number[]} [options.args[].args[].args[].choices] - An optional set of static, defined choices/values for this argument.
     * @param {Boolean} [options.args[].args[].args[].optional] - Whether or not the argument is optional. Default is false.
     * @param {"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].args[].args[].type - The datatype of the argument.
     */
    constructor(name, options, method) {
        this.name = name;
        this.method = method;
        this.options = options;
        this.perms = options.perms;
        this.roles = options.roles;
        this.desc = options.desc;
        // this.cooldown = options.cooldown; //Not implemented atm
        this.channels = options.channels;
        this.guilds = options.guilds;
        this.args = options.args;

        //Add this command to the command list
        SlashCommand.COMMANDS[name] = this;
    }

    /**
     * Sets up this slash command in every specified guild, or globally if no guild is specified.
     * @param {ExtendedClient} client - The Elisif Discord Client
     */
    setup(client) {

        let isGuildBased = this.guilds && this.guilds.length > 0;

        if (isGuildBased) {

            this.guilds.forEach(guild => {

                let manager = new SlashManager(guild, client, client.token, client.public_key);
                manager.add({
                    name: this.name,
                    desc: this.desc,
                    args: this.args
                });

            });

        }
        else {

            let manager = new SlashManager(null, client.token, client.public_key);
            manager.add({
                name: this.name,
                desc: this.desc,
                args: this.args
            });

        }

    }

    /**
     * Sets up an event handler for all slash commands.
     * @param {ExtendedClient} client - The Elisif Discord Client
     */
    static setupEvent(client) {

        client.on("slashCommand", (slash) => {
            SlashManager.execute(slash);
        });

    }

    /**
     * Sets up all slash commands in all of their specified guilds (or globally).
     * @param {ExtendedClient} client - The Elisif Discord Client
     */
    static setupAll(client) {

        for (let command of Object.values(SlashCommand.COMMANDS)) {
            command.setup(client);
        }

        SlashCommand.setupEvent(client);

    }

    /**
     * Gets the SlashCommand object that correlates with the specified SlashInteraction object.
     * @param {SlashInteraction} slash - A raw SlashInteraction object.
     */
    static getCommand(slash) {
        if (slash.name in SlashCommand.COMMANDS) {
            //Return the Guild/Global Slash Command
            return SlashCommand.COMMANDS[slash.name];
        }
        else {
            //Slash Command not found, return nonfunctional object with just an execute method
            return {
                method: () => false
            };
        }
    }

    /**
     * Executes the SlashCommand method that correlates with the specified SlashInteraction object.
     * @param {SlashInteraction} slash - A raw SlashInteraction object.
     */
    static execute(slash) {
        let command = SlashCommand.getCommand(slash);
        let failsFilter = SlashCommand.failsFilter(command);

        if (!failsFilter) {
            const slashInteraction = SlashManager.generateFromInteraction(slash);
            return command.method(slashInteraction);
        }
        else {
            return slash.delayedReply("An error occurred:\n\n" + failsFilter, true, 2500);
        }
    }

    /**
     * Checks whether the slash command fails filter checks, and if so, returns the appropriate error message.
     * @param {SlashCommand} command - A SlashCommand object.
     * @returns {String|Boolean} The error message to send to the user, or 'false' if the filter is passed.
     */
    static failsFilter(command) {
        if (!command) return "Sorry, that slash command could not be found";

        //Check channels
        let validChannel = command.channels.some(channel => channel == slash.channel.id || channel == slash.channel.name);
        if (!validChannel) return `Sorry, that command cannot be used in this channel.`;

        //Check perms
        let hasPerms = command.perms ? command.perms.every(perm => slash.member.hasPermission(perm.toUpperCase())) : true;

        //Check roles
        let hasRoles = command.roles ? command.roles.some(role => slash.member.roles.cache.find(r => r.name == role)) : true;

        //Return if the user either does not have the roles or does not have the perms
        if (!hasPerms || !hasRoles) return `Sorry, you do not have perms to use that command.`;

        //If all filters have passed, return false (to signify that the filter has NOT been failed)
        return false;
    }

}

module.exports = SlashCommand;