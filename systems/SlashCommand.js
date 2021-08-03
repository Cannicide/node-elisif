//Jay's SlashCommand class v1.0


const SlashManager = require("../managers/SlashManager");
const SlashInteraction = require("../structures/SlashInteraction");


/**
 * A class representing an executable Slash Command.
 */
class SlashCommand {

    //Contains all SlashCommand objects, organized by command name
    static COMMANDS = {};

    //Whether or not setupAll() has already occurred
    static isPostSetup = false;

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
     * @param {Object[]|SlashCommand.SubGroupBuilder[]|SlashCommand.SubCommandBuilder[]|SlashCommand.ArgumentBuilder[]} [options.args] - A list of the possible command arguments of a command.
     * @param {String} options.args[].name - The name of the argument.
     * @param {String} options.args[].desc - The description of the argument.
     * @param {String|Number} [options.args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
     * @param {String[]|Number[]} [options.args[].choices] - An optional set of static, defined choices/values for this argument.
     * @param {Boolean} [options.args[].optional] - Whether or not the argument is optional. Default is false.
     * @param {"sub"|"group"|"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].type - The datatype of the argument.
     * 
     * @param {Object[]|SlashCommand.SubCommandBuilder[]|SlashCommand.ArgumentBuilder[]} [options.args[].args] - A list of the possible subarguments of this subcommand, or subcommands of this subgroup, if applicable.
     * @param {String} options.args[].args[].name - The name of the argument or subcommand.
     * @param {String} options.args[].args[].desc - The description of the argument or subcommand.
     * @param {String|Number} [options.args[].args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
     * @param {String[]|Number[]} [options.args[].args[].choices] - An optional set of static, defined choices/values for this argument.
     * @param {Boolean} [options.args[].args[].optional] - Whether or not the argument is optional. Default is false.
     * @param {"sub"|"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].args[].type - The datatype of the argument.
     *
     * @param {Object[]|SlashCommand.ArgumentBuilder[]} [options.args[].args[].args] - A list of the possible subarguments of this subcommand, if applicable.
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
     * Creates a SlashCommandBuilder from slash command options, which can be used to construct a SlashCommand.
     * @param {String} name - The name of the slash command, used to call the slash command and identify it in the help command.
     * @param {Object} options - Command options.
     * @param {String[]} [options.perms] - Any Discord permissions required to run the command.
     * @param {String[]} [options.roles] - Any Discord roles required to run the command.
     * @param {String} [options.desc] - Optional description of the command.
     * @param {String[]} [options.channels] - Specify channel names/IDs to restrict this command to.
     * @param {String[]} [options.guilds] - Specify guild IDs to restrict this command to.
     * @param {function(Object, String[]):void} method - The method that is executed when the command is called. Has parameters (message, args).
     * 
     * @param {Object[]|SlashCommand.SubGroupBuilder[]|SlashCommand.SubCommandBuilder[]|SlashCommand.ArgumentBuilder[]} [options.args] - A list of the possible command arguments of a command.
     * @param {String} options.args[].name - The name of the argument.
     * @param {String} options.args[].desc - The description of the argument.
     * @param {String|Number} [options.args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
     * @param {String[]|Number[]} [options.args[].choices] - An optional set of static, defined choices/values for this argument.
     * @param {Boolean} [options.args[].optional] - Whether or not the argument is optional. Default is false.
     * @param {"sub"|"group"|"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].type - The datatype of the argument.
     * 
     * @param {Object[]|SlashCommand.SubCommandBuilder[]|SlashCommand.ArgumentBuilder[]} [options.args[].args] - A list of the possible subarguments of this subcommand, or subcommands of this subgroup, if applicable.
     * @param {String} options.args[].args[].name - The name of the argument or subcommand.
     * @param {String} options.args[].args[].desc - The description of the argument or subcommand.
     * @param {String|Number} [options.args[].args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
     * @param {String[]|Number[]} [options.args[].args[].choices] - An optional set of static, defined choices/values for this argument.
     * @param {Boolean} [options.args[].args[].optional] - Whether or not the argument is optional. Default is false.
     * @param {"sub"|"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].args[].type - The datatype of the argument.
     *
     * @param {Object[]|SlashCommand.ArgumentBuilder[]} [options.args[].args[].args] - A list of the possible subarguments of this subcommand, if applicable.
     * @param {String} options.args[].args[].args[].name - The name of this argument.
     * @param {String} options.args[].args[].args[].desc - The description of this argument.
     * @param {String|Number} [options.args[].args[].args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
     * @param {String[]|Number[]} [options.args[].args[].args[].choices] - An optional set of static, defined choices/values for this argument.
     * @param {Boolean} [options.args[].args[].args[].optional] - Whether or not the argument is optional. Default is false.
     * @param {"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].args[].args[].type - The datatype of the argument.
     * 
     * @returns {SlashCommand.SlashCommandBuilder} SlashCommandBuilder
     */
    static from(name, options, method) {
        return new SlashCommandBuilder(name, options, method);
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
        SlashCommand.isPostSetup = true;

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

    /**
     * A class representing a builder utility for Slash Command Subgroups.
     */
    static SubGroupBuilder = class SubGroupBuilder {

        /**
         * @param {Object} options - Options for this subgroup
         * @param {String} options.name - The name of the subgroup.
         * @param {String} options.desc - The description of the subgroup.
         * @param {SlashCommand.SubCommandBuilder[]} [options.args] - The subcommands of this subgroup.
         */
        constructor(options) {
            this.type = "group";
            this.name = options?.name;
            this.desc = options?.desc;
            this.args = options?.args ?? [];
        }

        /**
         * @param {String} name - The name of the subgroup.
         * @returns {SlashCommand.SubGroupBuilder} This SubGroupBuilder
         */
        setName(name) {
            this.name = name;
            return this;
        }

        /**
         * @param {String} description - The description of the subgroup.
         * @returns {SlashCommand.SubGroupBuilder} This SubGroupBuilder
         */
        setDescription(description) {
            this.desc = description;
            return this;
        }

        /**
         * @param {SlashCommand.SubCommandBuilder} subCommand - A subcommand to add to the subgroup.
         * @returns {SlashCommand.SubGroupBuilder} This SubGroupBuilder
         */
        addSubCommand(subCommand) {
            this.args.push(subCommand);
            return this;
        }

    }

    /**
     * A class representing a builder utility for Slash Command Subcommands.
     */
    static SubCommandBuilder = class SubCommandBuilder {

        /**
         * @param {Object} options - Options for this subcommand
         * @param {String} options.name - The name of the subcommand.
         * @param {String} options.desc - The description of the argument.
         * @param {SlashCommand.ArgumentBuilder[]} [options.args] - The arguments of this subcommand.
         */
        constructor(options) {
            this.type = "sub";
            this.name = options?.name;
            this.desc = options?.desc;
            this.args = options?.args ?? [];
        }

        /**
         * @param {String} name - The name of the subcommand.
         * @returns {SlashCommand.SubCommandBuilder} This SubCommandBuilder
         * */
        setName(name) {
            this.name = name;
            return this;
        }

        /**
         * @param {String} description - The description of the subcommand.
         * @returns {SlashCommand.SubCommandBuilder} This SubCommandBuilder
         * */
        setDescription(description) {
            this.desc = description;
            return this;
        }

        /**
         * @param {SlashCommand.ArgumentBuilder} arg - A subargument to add to this subcommand.
         * @returns {SlashCommand.SubCommandBuilder} This SubCommandBuilder
         * */
        addArgument(arg) {
            this.args.push(arg);
            return this;
        }

    }

    /**
     * A class representing a builder utility for Slash Command Arguments.
     */
    static ArgumentBuilder = class ArgumentBuilder {

        /**
         * @param {Object} options - Options for this argument
         * @param {String} options.name - The name of the argument.
         * @param {String} options.desc - The description of the argument.
         * @param {String} [options.type] - The type of the argument.
         * @param {String} [options.choices] - Optional static, defined choices/values of the argument for the user to choose from.
         * @param {boolean} [options.optional] - Whether the argument is optional or not.
         */
        constructor(options) {
            this.type = options?.type ?? "string";
            this.name = options?.name;
            this.desc = options?.desc;
            this.choices = options?.choices ?? [];
            if (options && "optional" in options) this.optional = options.optional;
        }

        /**
         * @param {String} name - The name of the argument.
         * @returns {SlashCommand.ArgumentBuilder} This ArgumentBuilder
         */
        setName(name) {
            this.name = name;
            return this;
        }

        /**
         * @param {String} description - The description of the argument.
         * @returns {SlashCommand.ArgumentBuilder} This ArgumentBuilder
         * */
        setDescription(description) {
            this.desc = description;
            return this;
        }

        /**
         * @param {String} type - The type of the argument.
         * @returns {SlashCommand.ArgumentBuilder} This ArgumentBuilder
         * */
        setType(type) {
            this.type = type;
            return this;
        }

        /**
         * @param {String} choice - A defined choice/value of this argument for the user to choose from.
         * @returns {SlashCommand.ArgumentBuilder} This ArgumentBuilder
         */
        addChoice(choice) {
            this.choices.push({
                name: choice,
                value: choice
            });
            return this;
        }

        /**
         * @param {String[]} choices - An array of defined choices/values of this argument for the user to choose from.
         * @returns {SlashCommand.ArgumentBuilder} This ArgumentBuilder
         */
        addChoices(choices) {
         
            choices.forEach(this.addChoice.bind(this));
            return this;

        }

        setOptional(bool) {
            this.optional = bool;
            return this;
        }

    }

    /**
     * A class representing a builder utility for Slash Commands.
     */
    static SlashCommandBuilder = class SlashCommandBuilder {
   
       /**
        * Creates a new builder for a Slash Command that can be called by users and run by the bot.
        * @param {String} name - The name of the slash command, used to call the slash command and identify it in the help command.
        * @param {Object} options - Command options.
        * @param {String[]} [options.perms] - Any Discord permissions required to run the command.
        * @param {String[]} [options.roles] - Any Discord roles required to run the command.
        * @param {String} [options.desc] - Optional description of the command.
        * @param {String[]} [options.channels] - Specify channel names/IDs to restrict this command to.
        * @param {String[]} [options.guilds] - Specify guild IDs to restrict this command to.
        * @param {function(Object, String[]):void} method - The method that is executed when the command is called. Has parameters (message, args).
        * 
        * @param {Object[]|SlashCommand.SubGroupBuilder[]|SlashCommand.SubCommandBuilder[]|SlashCommand.ArgumentBuilder[]} [options.args] - A list of the possible command arguments of a command.
        * @param {String} options.args[].name - The name of the argument.
        * @param {String} options.args[].desc - The description of the argument.
        * @param {String|Number} [options.args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
        * @param {String[]|Number[]} [options.args[].choices] - An optional set of static, defined choices/values for this argument.
        * @param {Boolean} [options.args[].optional] - Whether or not the argument is optional. Default is false.
        * @param {"sub"|"group"|"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].type - The datatype of the argument.
        * 
        * @param {Object[]|SlashCommand.SubCommandBuilder[]|SlashCommand.ArgumentBuilder[]} [options.args[].args] - A list of the possible subarguments of this subcommand, or subcommands of this subgroup, if applicable.
        * @param {String} options.args[].args[].name - The name of the argument or subcommand.
        * @param {String} options.args[].args[].desc - The description of the argument or subcommand.
        * @param {String|Number} [options.args[].args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
        * @param {String[]|Number[]} [options.args[].args[].choices] - An optional set of static, defined choices/values for this argument.
        * @param {Boolean} [options.args[].args[].optional] - Whether or not the argument is optional. Default is false.
        * @param {"sub"|"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].args[].type - The datatype of the argument.
        *
        * @param {Object[]|SlashCommand.ArgumentBuilder[]} [options.args[].args[].args] - A list of the possible subarguments of this subcommand, if applicable.
        * @param {String} options.args[].args[].args[].name - The name of this argument.
        * @param {String} options.args[].args[].args[].desc - The description of this argument.
        * @param {String|Number} [options.args[].args[].args[].value] - An optional, static value for the argument. Transforms this argument into a slash command choice argument.
        * @param {String[]|Number[]} [options.args[].args[].args[].choices] - An optional set of static, defined choices/values for this argument.
        * @param {Boolean} [options.args[].args[].args[].optional] - Whether or not the argument is optional. Default is false.
        * @param {"string"|"str"|"integer"|"int"|"boolean"|"bool"|"user"|"channel"|"role"|"mention"|"float"} options.args[].args[].args[].type - The datatype of the argument.
        */
       constructor(name, options, method) {
           this.name = name;
           this.options = options ?? {};
           this.options.args = this.options.args ?? [];

           this.method = method;
       }

       setName(name) {
           this.name = name;
           return this;
       }

       setDescription(desc) {
           this.options.desc = desc;
           return this;
       }

       setPerms(perms) {
           this.options.perms = perms;
           return this;
       }

       setRoles(roles) {
           this.options.roles = roles;
           return this;
       }

       setChannels(channels) {
           this.options.channels = channels;
           return this;
       }

       setGuilds(guilds) {
           this.options.guilds = guilds;
           return this;
       }

       setOptions(options) {
           this.options = options;
           return this;
       }

       /**
        * Sets all arguments of this slash command. Overrides any existing arguments that were previously added by this builder.
        * @param {Object[]|SlashCommand.SubGroupBuilder[]|SlashCommand.SubCommandBuilder[]|SlashCommand.ArgumentBuilder[]} args - A list of the possible arguments/groups/subcommands of this slash command.
        * @returns {SlashCommand.SlashCommandBuilder} SlashCommandBuilder
        */
       setArguments(args) {
           this.options.args = args;
           return this;
       }

       /**
        * Adds a subgroup to this slash command.
        * Either a plain object literal or a SubGroupBuilder can be provided.
        * @param {SlashCommand.SubGroupBuilder} group - A subgroup argument to add to this slash command.
        * @returns {SlashCommand.SlashCommandBuilder} SlashCommandBuilder
        */
       addSubGroup(group) {
           this.options.args.push(group);
           return this;
       }

       /**
        * Adds a subcommand to this slash command.
        * Either a plain object literal or a SubCommandBuilder can be provided.
        * @param {SlashCommand.SubCommandBuilder} sub - A subcommand argument to add to this slash command.
        * @returns {SlashCommand.SlashCommandBuilder} SlashCommandBuilder
        */
       addSubCommand(cmd) {
           this.options.args.push(cmd);
           return this;
       }

       /**
        * Adds an argument to this slash command. The argument can be a regular argument, subcommand, or subgroup.
        * Any of a plain object literal, an ArgumentBuilder, a SubCommandBuilder, or a SubGroupBuilder can be provided.
        * @param {SlashCommand.ArgumentBuilder|SlashCommand.SubCommandBuilder|SlashCommand.SubGroupBuilder} arg - An argument to add to this slash command.
        * @returns {SlashCommand.SlashCommandBuilder} SlashCommandBuilder
        */
       addArgument(arg) {
           this.options.args.push(arg);
           return this;
       }
   
       /**
        * Builds a SlashCommand object using all of the options defined by this SlashCommandBuilder.
        * Automatically sets up the slash command if this is built after command initialization on project startup.
        * @returns {SlashCommand} The built SlashCommand object.
        */
       build() {
           let cmd = new SlashCommand(this.name, this.options, this.method);
           if (SlashCommand.isPostSetup) cmd.setup(require("../index").getClient());
           return cmd;
       }
   
   }

}

module.exports = SlashCommand;