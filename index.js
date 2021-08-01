//NodeElisif by Cannicide

const Handler = require('./client/Handler');
const Command = require("./systems/Command");
const Interface = require("./systems/interface");
const EvG = require("./systems/evg");
const Interpreter = require("./systems/interpreter");
const Settings = require("./systems/settings");
const fetch = require("node-fetch");

class NodeElisif extends Handler {

    Command = Command;
    interface = Interface;
    evg = EvG;
    interpreter = Interpreter;
    settings = Settings;
    fetch = fetch;

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