//NodeElisif by Cannicide

const Handler = require('./client/Handler');
const Command = require("./structures/Command");
const Alias = require("./structures/Alias");
const SlashCommand = require("./structures/SlashCommand");
const { NamespacedCommand, NamespacedSlashCommand } = require("./structures/NamespacedCommand");
const { ExpansionCommand, ExpansionSlashCommand } = require("./structures/ExpansionCommand");
const Interface = require("./systems/interface");
const EvG = require("./systems/evg");
const Utility = require("./util/Utility");
const Interpreter = require("./systems/interpreter");
const fetch = require("node-fetch");

class NodeElisif extends Handler {

    /**
     * @deprecated
     */
    Command = Command;

    /**
     * @deprecated
     */
    NamespacedCommand = NamespacedCommand;

    /**
     * @deprecated
     */
    ExpansionCommand = ExpansionCommand;

    Alias = Alias;
    interface = Interface;
    evg = EvG;
    interpreter = Interpreter;
    fetch = fetch;
    SlashCommand = SlashCommand;
    NamespacedSlashCommand = NamespacedSlashCommand;
    ExpansionSlashCommand = ExpansionSlashCommand;
    util = Utility;

    version = require("./package.json").version;

    #instance;

    constructor() {
        super();
        this.#instance = this;
    }

    getInstance() {
        return this;
    }

    getInstanceAtInitialize() {
        return this.#instance;
    }

    getStatic() {
        return NodeElisif;
    }

    getClient(identifier) {
        let cl = this.Client.get(identifier);
        return cl;
    }

}

module.exports = new NodeElisif();