const Interaction = require('./Interaction');
const { ReadonlyEdist } = require('../util');
const { SyntaxCache, SyntaxParser } = require('../features/syntax');
const { CommandInteraction: BaseCommandInteraction } = require('discord.js');

module.exports = class CommandInteraction extends Interaction {

    /** @type {BaseCommandInteraction} */
    #c;

    /** @type {SyntaxCommandResolvable} */
    #syntax;

    #syntaxArgs;

    constructor(client, interaction) {
        super(client, interaction);
        this.#c = interaction;

        this.#syntax = SyntaxCache.get(this.#c.commandName);
        if (this.#syntax) this.#syntaxArgs = SyntaxParser.argumentValues(this.#syntax.arguments, this.#c);
        else this.#syntaxArgs = this.#c.options.data;
    }

    get name() {
        return this.#c.commandName;
    }

    get subcommand() {
        let subcommand;
        
        try {
            subcommand = this.#c.options.getSubcommand();
        }
        catch {
            subcommand = null;
        }

        return subcommand;
    }

    get args() {
        const argList = this.#syntaxArgs.args.toArray().reduce((acc, curr) => (acc[curr.name] = curr.value ?? this.#syntax?.defaults.get((this.subcommand ? `${this.subcommand}:` : "") + curr.name) ?? null, acc), {});
        return ReadonlyEdist.fromObject(argList);
    }

    get flags() {
        const flagList = this.#syntaxArgs.flags.reduce((acc, curr) => ({
            ...acc,
            [curr.name]: true,
            [curr.value]: true
        }), {});
        return ReadonlyEdist.fromObject(flagList);
    }

}