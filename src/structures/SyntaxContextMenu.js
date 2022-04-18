const SyntaxCommand = require("./SyntaxCommand");
const { SyntaxCache } = require("../features/syntax");
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord-api-types/v10');

class SyntaxContextMenu extends SyntaxCommand {

    constructor(name) {
        super(name);

        /** @private */
        this.description = undefined;
        /** @private */
        this.argument = undefined;
        /** @private */
        this.arguments = undefined;
    }

    build() {
        const factory = new ContextMenuCommandBuilder();
        const built = this.builder.build();

        if (built.type == "CHAT_INPUT") throw new Error("Cannot build a chat input context menu.\nUse the type() method to set the context menu type as 'user' or 'message'.");

        factory.setName(built.command)
        .setType(built.type == "USER" ? ApplicationCommandType.User : ApplicationCommandType.Message);
        
        built.json = factory.toJSON();
        SyntaxCache.set(built.command, built);
    }

    /**
     * Sets the type of context menu this command represents.
     * @param {"user"|"message"} type - The type of context menu this command represents. Case insensitive.
     * @returns
     * @throws If the type is not "user" or "message".
     */
    type(type) {
        if (!["USER", "MESSAGE"].includes(type.toUpperCase())) throw new Error(`Invalid context menu type: ${type}. Type must be 'USER' or 'MESSAGE'.`);
        this.builder.setType(type.toUpperCase());
        return this;
    }

}

module.exports = SyntaxContextMenu;