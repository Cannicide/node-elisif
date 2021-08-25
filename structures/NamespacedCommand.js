const Command = require('./Command');
const SlashCommand = require('./SlashCommand');

/**
 * @deprecated
*/
class NamespacedCommand {

    /**
     * @param {(import("../client/Handler").Client) => Object} optionsFunction
    */
    constructor(optionsFunction) {
        this.optionsFunction = optionsFunction;
    }

    build(client) {
        client.debug("Building " + (this.name ? `ExpansionCommand for expansion "${this.name}"...` : "NamespacedCommand..."));
        return new Command(this.optionsFunction(client));
    }

}

class NamespacedSlashCommand extends NamespacedCommand {

    build(client) {
        client.debug("Building " + (this.name ? `ExpansionSlashCommand for expansion "${this.name}"...` : "NamespacedSlashCommand..."));
        return new SlashCommand(this.optionsFunction(client));
    }

}

module.exports = {
    NamespacedCommand,
    NamespacedSlashCommand
};