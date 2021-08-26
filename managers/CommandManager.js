/*
    Cannicide's CommandManager v1.0

    All command handling methods were moved into this class and rewritten
    in order to vastly improve efficiency and reduce redundancy. This manager
    is now much neater, cleaner, and easier-to-use than the original handling
    system of `Handler.js`.
*/

//Command class
const Command = require("../structures/Command");

//SlashCommand class
const SlashCommand = require("../structures/SlashCommand");

//NamespacedCommand class
const { NamespacedCommand } = require("../structures/NamespacedCommand");

//File system initialized
const fs = require("fs");

//Aliases initialized
const AliasManager = require("../managers/AliasManager");

class CommandManager {

    #commands = new Map();

    constructor(client) {
        this.client = client;
    }


    add(command) {
        if (command instanceof Command) {
            this.client.debug(`Added command: ${command.name}`);

            this.#commands.set(command.name, command);
            command.initialize(this.client);
            return command;
        }
        else return false;
    }

    importCommands(files, directory) {
        files.filter(item => typeof item != 'string' || item.endsWith('.js')).forEach(item => {
            var file = typeof item === 'string' ? require(`${directory}/${item.substring(0, item.length - 3)}`) : item;

            if (file instanceof NamespacedCommand) file = file.build(this.client);
            if (file instanceof Command && !this.has(file.name)) this.add(file);
            else if (file && "commands" in file) {
                file.commands = file.commands.map(cmd => cmd instanceof NamespacedCommand ? cmd.build(this.client) : cmd);
                file.commands.filter(alias => alias instanceof Command && !this.has(alias.name)).forEach(alias => this.add(alias));
                if (typeof file.initialize === 'function') file.initialize(this.client);
            }
        });
    }

    remove(command) {
        if (command instanceof Command) this.#commands.delete(command.name);
        else this.#commands.delete(command);
    }

    handle(message) {

        message.client.debug("Handling message...");

        const msgutil = require("../index").util.Message(message);
        var command = this.get(msgutil.label);

        if (command && msgutil.startsWithPrefix) {

            message.client.debug(`Message contains command. Handling command "${msgutil.label}"...`);

            if (command.guild_only && message.channel.type == "DM") {
                //Only allow guild-only commands in guilds
                message.channel.send("```md\n# Sorry, you cannot use this command in a DM.\n> Please use this command in a guild.```");
                return false;
            }
            else if (command.dm_only && message.channel.type != "DM") {
                //Only allow DM-only commands in DMs
                message.channel.send("```md\n# Sorry, this command cannot be used in guilds.\n> Please use this command in DMs.```");
                return false;
            }

            message.channel.sendTyping();

            setTimeout(async () => {

                await command.execute(message).catch(err => {
                    const baseMessage = `** @${message.author.username}, the following error(s) occurred **`;
                    const upperHeader = "#" + "=".repeat(baseMessage.length - 2) + "#";
                    const lowerHeader = "=".repeat(baseMessage.length);

                    message.reply(msgutil.interface.createEmbed({desc: "```md\n" + `${upperHeader}\n${baseMessage}\n${lowerHeader}\n\n${err}` + "```"}, message));
                });

            }, 1000);

            //Is a command, successfully handled
            return true;
        }
        //Is not a command, did not handle
        else return false;

    }

    initialize(directory) {

        if (directory.endsWith("/")) directory = directory.substring(0, directory.length - 1);

        //Get user's commands:
        var files = fs.readdirSync(directory);

        //Get enabled expansions:
        var expansions = fs.readdirSync(__dirname + "/../expansions");
        expansions.forEach(expansion => {
            if (this.client.expansions.all().includes(expansion.substring(0, expansion.length - 3)))
                files.push(require(`${__dirname + "/../expansions"}/${expansion.substring(0, expansion.length - 3)}`));
        });

        //Import commands:
        this.importCommands(files, directory);

        //Import aliases:
        this.importCommands([this.aliases], directory);

        SlashCommand.setupAll(this.client);

        this.client.debug("\nLoaded commands:\n[", this.all().map(v => v.name).join(", "), "]\n");

        return this.all();

    }

    has(commandName) {
        return this.#commands.has(commandName);
    }

    get(commandName) {
        return this.has(commandName) ? this.#commands.get(commandName) : undefined;
    }

    all() {
        return Array.from(this.#commands.values());
    }

    getUsableInChannel(channel) {
        var { id, name } = channel;
        return this.all().filter(command => command.channels.includes(id) || command.channels.includes(name));
    }

    get commands() {
        return this.#commands;
    }

    aliases = new AliasManager();

}

module.exports = CommandManager;