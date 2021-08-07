/*
    Cannicide's Command Class v3.0

    Completely rewritten to be neater, cleaner, shorter, and ten times more efficient.
    Now includes even more simplified constructor with new name, guild restrictions,
    initialize method, execute method, and guild-only command options. Now also
    completely rewritten to use ES6 syntax.

    Error messages during command execution have also been vastly improved, with ALL
    issues being identified in the error message (instead of just the first issue).
*/

class Command {

    constructor({ 
        perms = [],
        roles = [],
        invisible = false,
        name = false,
        desc = "",
        dm_only = false,
        guild_only = true,
        cooldown = 0,
        aliases = [],
        channels = [],
        guilds = [],
        is_alias = false,
        args = [],
        expansion = false,
        execute = undefined,
        initialize = () => {}
    }, method) {

        this.perms = perms;
        this.roles = roles;
        this.invisible = invisible;
        this.name = name;
        this.desc = desc;
        this.dm_only = dm_only;
        this.guild_only = guild_only;
        this.cooldown = cooldown;
        this.aliases = new Set(aliases);
        this.channels = channels;
        this.guilds = guilds;
        this.is_alias = is_alias;
        this.args = args;
        this.expansion = expansion;
        this.method = execute ?? method;
        this.initializeMethod = initialize;
        this.flags = false;

        this.cooldowns = new Map();
        this.manager = require("../managers/CommandManager");

        const client = require("../index").getClient();
        this.initialize(client);

    }

    execute(message) {

        if (!message) throw new Error("No message was detected by Command execution; this is an impossible occurrence and has resulted in a fatal error.");

        //Set valid flags, if any, on the message
        if (this.flags) {
            message.setValidFlags(this.flags);

            //Refer to this getter to auto-remove flags from args property
            message.cmdFlags;
        }

        return new Promise(async (resolve, reject) => {
            let errors = [];

            //Check for errors and filter failures
            const filter = new this.Filters(message, this);
            if (!filter.checkDmOnly()) {
                errors.push("Sorry, that command only works in DMs.");
            }
            if (!filter.checkGuildOnly()) {
                errors.push("Sorry, that command only works in guilds.");
            }
            if (!filter.checkGuilds()) {
                errors.push("Sorry, that command cannot be used in this guild.");
            }
            if (!filter.checkChannels()) {
                errors.push("Sorry, that command cannot be used in this channel.");
            }
            if (!filter.checkCooldown()) {
                errors.push("Sorry, you can't use that command again for another " + filter.cooldown + " seconds.");
            }
            if (!filter.checkMandatoryArgs()) {
                errors.push("Sorry, you need to provide the correct arguments for that command.");
                var missedArgs = filter.mandatoryArgs.slice(filter.userArgs.length);
                var error = "";

                missedArgs.forEach(arg => {
                    var feedback = arg.feedback ?? `Please specify the argument: **\`${arg.name}\`**.`;
                    if (feedback != "none")
                        error += "\t- " + feedback + "\n";

                    //Attaching Embed feedback in individual arg feedback properties is no longer supported.
                });

                error += `\t- Review the syntax for this command with \`${message.client.prefix.get()}help ${this.name}\`.`;
                errors.push(error);
            }
            if (!filter.checkPerms() || !filter.checkRoles()) {
                errors.push("Sorry, you don't have permission to use that command.");
                var missedPerms = filter.missingPerms;
                var error = "";

                missedPerms.forEach(perm => {
                    error += "\t- Missing " + perm + "\n";
                });

                error += `\t- Review the perms needed for this command with \`${message.client.prefix.get()}help ${this.name}\`.`;
                errors.push(error);
            }


            if (errors.length <= 0) return resolve(await this.method(message));
            else return reject(errors.join("\n"));
        });
    }

    Filters = class CommandFilters {

        constructor(message, command) {
            this.message = message;
            this.command = command;

            //Establish mandatory arg properties
            this.userArgs = message.args ?? [];
            this.mandatoryArgs = this.command.args.filter(arg => !arg.optional);

            //Establish cooldown time properties
            const now = Date.now();
            this.cooldownAmount = this.command.cooldown * 1000;
            this.userCooldown = this.command.cooldowns.get(message.author.id) ?? (now - this.cooldownAmount);
            this.expirationTime = this.userCooldown + this.cooldownAmount;
            this.now = now;

            const timeLeft = (this.expirationTime - now) / 1000;
            const lastUseTimePassed = (now - this.userCooldown) / 1000;
            this.cooldown = timeLeft.toFixed(1);

            message.setCooldownLeft(timeLeft);
            message.setSinceLastUse(lastUseTimePassed);

            //Establish missing perms properties
            this.missingPerms = [];
        }

        checkPerms() {
            //Member must have ALL required permissions
            var hasPerms = !this.message.guild || this.command.perms.every(item => this.message.member.hasPermission(item.toUpperCase()));
            if (!hasPerms) this.missingPerms = this.missingPerms.concat(this.command.perms.filter(item => !this.message.member.hasPermission(item.toUpperCase())).map(perm => "Perm: " + perm));
            return hasPerms;
        }

        checkRoles() {
            //Member must have at least ONE required roles
            var hasRoles = !this.message.guild || this.command.roles.some(item => this.message.member.roles.cache.find(x => x.name == item));
            if (!hasRoles) this.missingPerms = this.missingPerms.concat(this.command.roles.filter(item => !this.message.member.roles.cache.find(x => x.name == item)).map(perm => "Role: " + perm));
            return hasRoles;
        }

        checkDmOnly() {
            return this.command.dm_only ? this.message.channel.type == "dm" : true;
        }

        checkGuildOnly() {
            return this.command.guild_only ? this.message.guild : true;
        }

        checkMandatoryArgs() {
            // Because mandatory arguments must always come before optional arguments, a simple length check will suffice
            return this.mandatoryArgs.length == 0 || this.mandatoryArgs.length <= this.userArgs.length;
        }

        checkCooldown() {
            return this.now >= this.expirationTime;
        }

        checkChannels() {
            return this.command.channels.length <= 0
                    || (this.command.channels.includes(this.message.channel.id) || this.command.channels.includes(this.message.channel.name));
        }

        checkGuilds() {
            return this.command.guilds.length <= 0
                    || !this.message.guild
                    || (this.command.guilds.includes(this.message.guild.id) || this.command.guilds.includes(this.message.guild.name));
        }

    }

    async initialize(client) {
        this.initializeMethod(client);

        this.addDefaultAlias(client)
        .setFlagArguments();

        if (!this.manager.has(this.name)) this.manager.add(this);
        if (!this.is_alias) this.addAliases(...this.aliases);

        return this;
    }

    async addAliases(...aliases) {

        const Alias = require('../structures/Alias');
        for (let alias of aliases) {
            new Alias(alias, this.name);
        }

        return this;

    }

    addDefaultAlias(client) {
        if (this.name && this.method && !this.is_alias)
            this.aliases.add(`${client.name ? client.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "elisif"}:` + this.name);

        return this;
    }

    setFlagArguments() {
        this.args.filter(arg => arg.flag).forEach(flag => {

            //Set flags to an array if existent
            if (!this.flags)
              this.flags = [];
      
            //Add to flags array
            this.flags.push({
              name: "-" + flag.name,
              desc: flag.flag
            });
      
            //All flags are optional
            flag.optional = true;
        });

        return this;
    }

    /**
     * Check if this command or any of its aliases have the name given.
     * @param {String} cmdName
     * @returns {boolean}
     */
    async match(cmdName) {
        return this.name == cmdName || this.aliases.has(cmdName);
    }

    get options() {
        return {
            perms: this.perms,
            roles: this.roles,
            invisible: this.invisible,
            name: this.name,
            desc: this.desc,
            dm_only: this.dm_only,
            guild_only: this.guild_only,
            cooldown: this.cooldown,
            aliases: Array.from(this.aliases),
            channels: this.channels,
            guilds: this.guilds,
            is_alias: this.is_alias,
            args: this.args,
            expansion: this.expansion,
            method: this.method,
            initializeMethod: this.initializeMethod
        };
    }

}

module.exports = Command;