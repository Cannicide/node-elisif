const { Intents } = require('discord.js');
const PRIVILEGED_INTENTS = ["GUILD_PRESENCES", "GUILD_MEMBERS", /*"GUILD_MESSAGES" Not privileged until Aug 2022*/];

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

    static get PRIVILEGED() {
        return [...Intent.INTENTS.keys()].filter(k => PRIVILEGED_INTENTS.includes(k)).map(k => new this(k));
    }

    static get UNPRIVILEGED() {
        return [...Intent.INTENTS.keys()].filter(k => !PRIVILEGED_INTENTS.includes(k)).map(k => new this(k));
    }
}