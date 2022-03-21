const User = require('./User');
const { ClientUser: BaseUser, ClientApplication } = require("discord.js");
const { parseBuilder } = require("../util");

class ActivityBuilder {
    /** @private */
    data = { name: null, type: null, url: null };
    name(name) {
        return (this.data.name = name) && this;
    }
    type = {
        streaming: (url) => (this.data.type = "STREAMING") && (this.data.url = url) && this,
        listening: () => (this.data.type = "LISTENING") && this,
        watching: () => (this.data.type = "WATCHING") && this,
        competing: () => (this.data.type = "COMPETING") && this,
        playing: () => (this.data.type = "PLAYING") && this
    };
}

module.exports = class ClientUser extends User {

    /** @type {BaseUser} */
    #c;
    constructor(client, clientUser) {
        super(client, clientUser);
        this.#c = clientUser;
    }

    get bot() {
        return true;
    }

    // settings = "new InMemorySettings()";

    isClient() {
        return true;
    }

    get system() {
        return false;
    }

    send() {
        // throw new ClientUserDMException();
        throw new Error("Cannot send a message to yourself (attempted to send message to the bot user).");
    }

    /**
     * @param {{name:string, type:string, url?:string}|(builder:ActivityBuilder) => void} optsOrBuilder
     */
    setActivity(optsOrBuilder) {
        const activity = parseBuilder(optsOrBuilder, ActivityBuilder) ?? {};
        const result = activity.data ?? activity ?? {};

        if (result.type.toUpperCase() === "STREAMING") {
            // Useful warnings about STREAMING activity validation
            if (!result.url) console.warn("ClientUser#setActivity Warning: A 'streaming' activity was set without providing a required stream url.\nThis will cause the bot to use a 'playing' activity instead.");
            else if (!result.url.match("twitch.tv") && !result.url.match("youtube.com")) console.warn("ClientUser#setActivity Warning: A 'streaming' activity was set with an invalid stream url.\nThis will cause the bot to use a 'playing' activity instead.\nPlease use https://twitch.tv/ or https://youtube.com/ stream urls.");
        } 
        return this.#c.setActivity(result);
    }

    static from(client, opts) {
        return new ClientUser(client, opts ?? { 
            bot: true,
            id: "000000000000000001"
        });
    }

    static handleReadyPacket(client, { d: data }, shard) {
        if (client.user) {
            client.user._patch(data.user);
        } else {
            const user = new BaseUser(client, data.user);
            client.user = new ClientUser(client, user);            
            client.users.cache.set(client.user.id, client.user);
        }
        
        for (const guild of data.guilds) {
            guild.shardId = shard.id;
            client.guilds._add(guild);
        }
        
        if (client.application) {
            client.application._patch(data.application);
        } else {
            client.application = new ClientApplication(client, data.application);
        }
        
        shard.checkReady();
    }

    static ActivityBuilder = ActivityBuilder;

}