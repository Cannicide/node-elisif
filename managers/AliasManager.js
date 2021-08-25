/*
    Cannicide's Alias Manager v1.3

    A reconstruction of the idea behind the former `aliases.js` file,
    redesigned to be more object-oriented and to use ES6 syntax.
*/

const Command = require('../structures/Command');

class AliasManager {
    constructor() {
        this.aliases = [];
    }

    add(alias) {
        if (alias instanceof Command) this.aliases.push(alias);
    }

    get commands() {
        return this.aliases;
    }

    set commands(commands) {
        this.aliases = commands;
    }

    get() {
        return this.aliases;
    }

    getNames() {
        return this.get().map(alias => alias.name);
    }
}

module.exports = AliasManager;