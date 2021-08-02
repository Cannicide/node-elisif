// An extension of the Discord.js Guild classes

const SlashManager = require("../managers/SlashManager");

function ExtendedGuild(ExtendableGuild) {
    class AdvancedGuild extends ExtendableGuild {

        advanced = true;

        constructor(client, data) {
            super(client, data);
        }

        get settings() {
            return this.elisif.settings.Local(this.id);
        }

        get prefix() {
            var localPrefix = this.elisif.settings.Local(this.id).get("local_prefix");
            if (!localPrefix) localPrefix = this.elisif.settings.Global().get("global_prefix");

            return localPrefix;
        }

        setPrefix(pfix) {
            this.elisif.settings.Local(this.id).set("local_prefix", pfix);
        }

        get commands() {
            return new SlashManager(message.guild.id, message.client);
        }

        isExtended() {
            return true;
        }

        get client() {
            return this.elisif.Client ? this.elisif.Client.getInstance() : null;
        }

        get elisif() { return require("../index").getInstance(); }
    }

    return AdvancedGuild;
}

module.exports = ExtendedGuild;