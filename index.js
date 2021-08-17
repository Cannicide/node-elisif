//NodeElisif by Cannicide

const Handler = require('./client/Handler');
const Command = require("./structures/Command");
const Alias = require("./structures/Alias");
const SlashCommand = require("./structures/SlashCommand");
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

    Alias = Alias;
    interface = Interface;
    evg = EvG;
    interpreter = Interpreter;
    fetch = fetch;
    SlashCommand = SlashCommand;
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
        return this.Client.get(identifier);
    }

}

module.exports = new NodeElisif();