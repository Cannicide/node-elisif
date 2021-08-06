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

//File system initialized
const fs = require("fs");

//Aliases initialized
const AliasManager = require("../managers/AliasManager");

//Global settings
const Settings = require("../systems/settings");


class CommandManager {

    static #commands = new Map();

    static add(command) {
        if (command instanceof Command) {
            CommandManager.#commands.set(command.name, command);
            command.initialize(CommandManager.client);
            return command;
        }
        else return false;
    }

    static remove(command) {
        if (command instanceof Command) CommandManager.#commands.delete(command.name);
        else CommandManager.#commands.delete(command);
    }

    static handle(message) {

        var localPrefix = message.getLocalSetting("local_prefix") ?? message.client.prefix.get() ?? "/";
        var command = CommandManager.get(message.label);

        if (command && message.labelWithPrefix.startsWith(localPrefix)) {
            message.channel.startTyping();

            setTimeout(async () => {

                await command.execute(message).catch(err => {
                    message.reply("an error occurred:\n\n" + err);
                });

                message.channel.stopTyping();
            }, 1000);

            //Is a command, successfully handled
            return true;
        }
        //Is not a command, did not handle
        else return false;

    }

    static initialize(directory) {

        if (directory.endsWith("/")) directory = directory.substring(0, directory.length - 1);

        //Get user's commands:
        var files = fs.readdirSync(directory);

        //Get aliases defined through Command constructor:
        files.push(CommandManager.aliases);

        //Get enabled expansions:
        var expansions = fs.readdirSync(__dirname + "/../expansions");
        expansions.forEach(expansion => {
            if (CommandManager.client.expansions.all().includes(expansion.substring(0, expansion.length - 3)))
                files.push(require(`${__dirname + "/../expansions"}/${expansion.substring(0, expansion.length - 3)}`));
        });

        //Import commands:
        files.forEach((item) => {
            var file = typeof item === 'string' ? require(`${directory}/${item.substring(0, item.length - 3)}`) : item;
            if (file instanceof Command) {
                CommandManager.add(file);
            }
            else if ("commands" in file) {
                file.commands.forEach((alias) => {
                    if (alias instanceof Command) CommandManager.add(alias);
                });

                if (typeof file.initialize === 'function') {
                    file.initialize(CommandManager.client);
                }
            }
        });

        SlashCommand.setupAll(CommandManager.client);

        if (Settings.Global().get("debug_mode")) console.log("Loaded commands:", CommandManager.all().map(v => v.name));

        return CommandManager.all();

    }

    static has(commandName) {
        return CommandManager.#commands.has(commandName);
    }

    static get(commandName) {
        console.log("COMMAND " + commandName, CommandManager.has(commandName));
        return CommandManager.has(commandName) ? CommandManager.#commands.get(commandName) : undefined;
    }

    static all() {
        return Array.from(CommandManager.#commands.values());
    }

    static getUsableInChannel(channel) {
        var { id, name } = channel;
        return CommandManager.all().filter(command => command.channels.includes(id) || command.channels.includes(name));
    }

    static get commands() {
        return CommandManager.#commands;
    }

    static get client() {
        return require("../index").getClient();
    }

    static aliases = new AliasManager();

}

module.exports = CommandManager;