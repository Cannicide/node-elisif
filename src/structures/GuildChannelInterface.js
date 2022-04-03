const { AppliableInterface } = require('../util');

module.exports = class GuildChannelInterface extends AppliableInterface {

    get guild() {
        if (!this.__base.guild) return null;
        const Guild = require('./Guild'); // Defined here to prevent circular dependency
        return new Guild(this.client, this.__base.guild);
    }

    // TODO: add parent prop

    // TODO: make clone() and all other base methods to return custom channel

    // TODO: channel permissions manager



}