// Represents a slash command interaction
// Similar in design, structure, and functionality to ExtendedMessage

const Interaction = require("../structures/Interaction");

class SlashInteraction extends Interaction {
  
    constructor(client, data) {

        super(client, data);
      
        //Define all base properties
        this.id = data.data.id;
        this.name = data.data.name;
        this.resolved = data.data.resolved;
        this.args = data.data.options ?? false;
        this.options = this.args;
      
        //Define custom args properties with modified structures
        this.args_classic = [];
        this.args_object = {};

        //Define accessible Elisif systems
        this.interface = this.elisif.interface;
        this.interpreter = this.elisif.interpreter;
        this.evg = this.elisif.evg;
        this.database = this.evg.resolve;
        this.db = this.database;
        this.dbAsync = this.evg.from;
        this.dbJson = this.evg.cache;
        this.dbDynamic = this.evg.remodel;
        this.getGlobalSetting = (sett) => this.elisif.settings.Global().get(sett);
        this.getLocalSetting = (sett) => this.elisif.settings.Local(this.guild?.id).get(sett);
      
        //Token-required utilities for responding to interactions
        if (data.token) {
          
            //Note: it is not possible to not send any message reply to a slash command, so the noReply() method has been removed
            //It has been replaced with a defaultReply() method, which will respond with a default reply
            this.defaultReply = () => {
              return super.defaultReply(`You used the [\`/${this.name}\`](https://cannicideapi.glitch.me/news/discord-elisif/cannicide-library-added-slash-commands-feature/01) slash command.`);
            }

        }
    }

    get label() {
        return this.name;
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

module.exports = SlashInteraction;