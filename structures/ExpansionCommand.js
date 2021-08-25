const { NamespacedCommand, NamespacedSlashCommand } = require('./NamespacedCommand');
const Utility = require('../util/Utility');

/**
 * @deprecated
*/
class ExpansionCommand extends NamespacedCommand {

    constructor(name, optionsFunction) {
        super(optionsFunction);
        this.name = name;
    }

    build(client) {
        return super.build((() => {
            this.optionsFunction = Utility.bindNth(this, this.optionsFunction, client.expansions.settings(this.name));
            return client;
        })());
    }

}

class ExpansionSlashCommand extends NamespacedSlashCommand {

    constructor(name, optionsFunction) {
        super(optionsFunction);
        this.name = name;
    }

    build(client) {
        return super.build((() => {
            this.optionsFunction = Utility.bindNth(this, this.optionsFunction, client.expansions.settings(this.name));
            return client;
        })());
    }

}

module.exports = {
    ExpansionCommand,
    ExpansionSlashCommand
}