//@ts-check

const StructureUtility = require("./StructureUtility");
const SlashManager = require("../managers/SlashManager");

class GuildUtility extends StructureUtility {

    /**
     * @param {import("./Utility")} util
    */
    constructor(guild, util) {

        super(guild, util);
        this.guild = guild;

        //Add this utility object to the map, mapped with the message ID
        this.set();

    }

    get settings() {
        return this.client.settings.Local(this.guild.id);
    }

    get prefix() {
        var localPrefix = this.settings.get("local_prefix");
        if (!localPrefix) localPrefix = this.settings.get("global_prefix");

        return localPrefix;
    }

    setPrefix(pfix) {
        this.settings.set("local_prefix", pfix);
    }

    get commands() {
        return new SlashManager(this.guild.id, this.client);
    }

}

module.exports = GuildUtility;