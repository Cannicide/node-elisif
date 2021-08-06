//NodeElisif by Cannicide

const Handler = require('./client/Handler');
const Command = require("./structures/Command");
const Alias = require("./structures/Alias");
const SlashCommand = require("./structures/SlashCommand");
const Interface = require("./systems/interface");
const EvG = require("./systems/evg");
const Interpreter = require("./systems/interpreter");
const Settings = require("./systems/settings");
const fetch = require("node-fetch");

class NodeElisif extends Handler {

    Command = Command;
    Alias = Alias;
    interface = Interface;
    evg = EvG;
    interpreter = Interpreter;
    settings = Settings;
    fetch = fetch;
    SlashCommand = SlashCommand;

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

    getClient() {
        return this.Client.getInstance();
    }

}

module.exports = new NodeElisif();