
const StructureUtility = require("./StructureUtility");

class SlashUtility extends StructureUtility {

    // #reply = {
    //     deleted: false,
    //     deferred: false,
    //     sent: false
    // }

    /**
     * @param {import("./Utility")} util
    */
    constructor(interaction, util) {

        super(interaction, util);
        
        //Define all base properties
        this.interaction = interaction;
        this.args = interaction.options.data?.slice() ?? false;
        this.resolved = interaction.options.resolved;
        this.options = this.args;
        this.channel = interaction.channel;
        this.guild = interaction.guild;
        this.member = interaction.member;
        this.user = interaction.user;

        //Define Context Menu interaction properties
        if (interaction.targetType && ["MESSAGE", "USER"].includes(interaction.targetType)) {

            let baseResolved = interaction.targetType == "MESSAGE" ? (this.channel.messages.cache.get(interaction.targetId)) : (this.guild.members.cache.get(interaction.targetId));

            this.target = {
                type: interaction.targetType,
                id: interaction.targetId,
                [interaction.targetType.toLowerCase()]: interaction.targetType == "MESSAGE" ? baseResolved : baseResolved?.user,
                [interaction.targetType == "USER" ? "member" : null]: baseResolved
            }
        }
        
        //Define custom args properties with modified structures
        this.args_classic = [];
        this.args_object = {};

        //Define accessible Elisif systems
        this.interface = this.elisif.interface;
        this.interpreter = this.elisif.interpreter;
        this.evg = this.elisif.evg;
        this.db = this.evg;
        this.getGlobalSetting = (sett) => this.client.settings.Global().get(sett);
        this.getLocalSetting = (sett) => this.client.settings.Local(this.guild?.id).get(sett);
        this.setGlobalSetting = (sett, val) => this.client.settings.Global().set(sett, val);
        this.setLocalSetting = (sett, val) => this.client.settings.Local(this.guild?.id).set(sett, val);

        //Add this utility object to the map, mapped with the message ID
        this.set();
    }

    get label() {
        return this.interaction.commandName;
    }

    get author() {
        return this.user;
    }

    isCommand() {
        return true;
    }

    getCommand() {
        //implement functionality here
    }

    getArg(key, varArgsOnly) {
        if (key === undefined || !this.args || this.args.length < 1) return false;
        //Get arg by name
        if (isNaN(key)) return this.args_object?.[key];
        //Get arg by index
        else return varArgsOnly ? this.varargs?.[key] : this.args_classic?.[key];
    }

    getArgs(...keys) {
        return keys ? keys.map(key => this.getArg(key)) : this.args;
    }

    hasArg(key, value) {
        return (this.getArg(key === undefined ? 0 : key) ? (key === undefined || value === undefined ? true : (typeof this.getArg(key) === "string" && typeof value === "string" ? this.getArg(key).toLowerCase() == value.toLowerCase() : this.getArg(key) == value)) : false) ?? true;
    }

    hasArgs(...keys) {
        return keys ? keys.every(key => this.hasArg(key)) : (this.args ? true : false);
    }

    /**
     * Returns the selected subgroup of the slash command, if applicable.
     */
    get subgroup() {
        if (!this.args || this.args.length < 1) return false;
        if (this.args[0].type == "group") return this.args_classic[0];
        return false;
    }

    /**
     * Returns the selected subcommand of the slash command, if applicable.
     */
    get subcommand() {
        if (this.subgroup && this.args_classic.length >= 2) return this.args_classic[1];
        if (!this.args) return false;
        if (this.args[0].type == "sub") return this.args_classic[0];
        return false;
    }

    /**
     * Returns the selected variable arguments of the slash command, if applicable, in a classic args structure.
     * The variable arguments are any args used in the command apart from the subgroup and subcommand.
     */
    get varargs() {
        if (this.subgroup && this.subcommand) return this.args_classic.slice(2);
        if (this.subcommand) return this.args_classic.slice(1);
        return this.args_classic;
    }

    get flatArgs() {
        return this.args_classic;
    }

    get mappedArgs() {
        let map = new this.util.ElisifMap(this.args_object)
        return map;
    }

    //Interaction reply methods:

    defaultReply() {
        return this.reply(`You used the [\`/${this.name}\`](https://cannicideapi.glitch.me/news/discord-elisif/cannicide-library-added-slash-commands-feature/01) slash command.`);
    }

    deleteReply(timeoutSecs = 0) {
        // if (this.#reply.deleted) return;
        // this.#reply.deleted = true;
        
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                await this.interaction.deleteReply();
                resolve(null);
            }, timeoutSecs * 1000);
        });
    }

    editReply(options, timeoutSecs = 0) {
        // if (this.#reply.sent || this.#reply.deleted || !this.#reply.deferred) return this.reply(options);
        // this.#reply.sent = true;

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                await this.interaction.editReply(options);
                let result = await this.interaction.fetchReply();
                this.util.Message(result, this.interaction);
                resolve(result);
            }, timeoutSecs * 1000);
        });
    }

    followUp(options) {
        // if (!this.#reply.sent) return this.reply(options);
        return this.interaction.followUp(options);
    }

    async reply(options) {

        // if (this.#reply.sent || this.#reply.deleted) return this.followUp(options);
        // if (this.#reply.deferred) return this.editReply(options);

        // this.#reply.sent = true;
        await this.interaction.reply(options);

        let result = await this.interaction.fetchReply();
        this.util.Message(result, this.interaction);
        return result;
    }

    deferReply(options) {

        // if (this.#reply.sent || this.#reply.deleted || this.#reply.deferred) return {fulfill: () => false};

        this.interaction.deferReply(options);
        // this.#reply.deferred = true;
        this.interaction.deferred = true;
        return {
            fulfill: (resp, timeoutSecs) => this.editReply(resp, timeoutSecs)
        };
    }

    //Structure Utility Methods:

    Member() {
        return this.util.Member(this.member);
    }

    Channel() {
        return this.util.Channel(this.channel, this);
    }

}

module.exports = SlashUtility;