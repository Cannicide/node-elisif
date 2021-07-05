//Module has not been fully developed yet. This is only a template at the moment.
//Requires testing before full use is authorized.

const Handler = require('./handler');
const Command = require("./command");
const Interface = require("./interface");
const EvG = require("./evg");
const Interpreter = require("./interpreter");
const Settings = require("./settings");
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

}

module.exports = new NodeElisif();