
const StructureUtility = require("./StructureUtility");

class SlashUtility extends StructureUtility {

    /**
     * @param {import("./Utility")} util
    */
    constructor(interaction, util) {

        super(interaction, util);
        
        //Define all base properties
        this.interaction = interaction;
        this.args = interaction.options.data.slice() ?? false;
        this.resolved = interaction.options.resolved;
        this.options = this.args;
        
        //Define custom args properties with modified structures
        this.args_classic = [];
        this.args_object = {};

        //Define accessible Elisif systems
        this.interface = this.elisif.interface;
        this.interpreter = this.elisif.interpreter;
        this.evg = this.elisif.evg;
        this.db = this.evg;
        this.getGlobalSetting = (sett) => this.elisif.settings.Global().get(sett);
        this.getLocalSetting = (sett) => this.elisif.settings.Local(this.guild?.id).get(sett);
        this.setGlobalSetting = (sett, val) => this.client.settings.Global().set(sett, val);
        this.setLocalSetting = (sett, val) => this.client.settings.Local(this.guild?.id).set(sett, val);

        //Sends a default reply to the slash interaction
        this.defaultReply = () => {
            return interaction.reply(`You used the [\`/${this.name}\`](https://cannicideapi.glitch.me/news/discord-elisif/cannicide-library-added-slash-commands-feature/01) slash command.`);
        }

        //Add this utility object to the map, mapped with the message ID
        this.set();
    }

    get label() {
        return this.interaction.commandName;
    }

    get author() {
        return this.interaction.user;
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
        return this.getArg(key === undefined ? 0 : key) ? (key === undefined || value === undefined ? true : (typeof this.getArg(key) === "string" && typeof value === "string" ? this.getArg(key).toLowerCase() == value.toLowerCase() : this.getArg(key) == value)) : false;
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

}

module.exports = SlashUtility;