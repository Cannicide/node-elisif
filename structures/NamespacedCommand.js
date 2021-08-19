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
        return new Command(this.optionsFunction(client));
    }

}

class NamespacedSlashCommand extends NamespacedCommand {

    build(client) {
        return new SlashCommand(this.optionsFunction(client));
    }

}

module.exports = {
    NamespacedCommand,
    NamespacedSlashCommand
};