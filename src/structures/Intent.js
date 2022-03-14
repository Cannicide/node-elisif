const { Intents } = require('discord.js');

module.exports = class Intent {

    static INTENTS = Object.keys(Intents.FLAGS).reduce((prev, curr) => prev.set(curr, Intents.FLAGS[curr]), new Map());

    constructor(name) {
        this.name = name;
        this.value = Intent.INTENTS.get(typeof name === 'string' ? name.toUpperCase().replace(/ /g, "_") : null) ?? name;
        this.id = name;
    }

    static valueOf(identifier) {
        return identifier instanceof this ? identifier.value : new this(identifier).value;
    }

    static get ALL() {
        return [...Intent.INTENTS.keys()].map(k => new this(k));
    }
}