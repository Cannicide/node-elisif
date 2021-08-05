const InteractionWebhookClient = require("../client/InteractionWebhookClient");
const { APIMessage } = require("discord.js");

class Interaction {

    constructor(client, data) {

        this.client = client;

        this._data = data;

        this.guild = data.guild_id ? client.guilds.cache.get(data.guild_id) : undefined;
        this.channel = client.channels.cache.get(data.channel_id);

        if (data.token) {

            this._data.token = data.token;
            this._data.discordID = data.id;
            this._data.applicationID = data.application_id;
            this._webhook = new InteractionWebhookClient(data.application_id, data.token, client.options);
            this._delayedReplyContent = false;

            /**
             * Sends a default reply message to the user who used the interaction.
             */
            this.defaultReply = (customMessage) => {
                return this.reply(customMessage, true);
            }

            /**
             * Sends an interaction reply message to the user who used the interaction. Supports ephemeral messages!
             * @param {*} content 
             * @param {*} ephemeral 
             * @param {*} options 
             */
            this.reply = async (content, ephemeral = false, options = {}) => {

                if (this.clickEnded) throw new Error('This interaction was already ended; cannot reply again.');

                var type = 4;

                if (options.reply_type) {
                    type = options.reply_type;
                    delete options.reply_type;
                }

                let apiMessage = APIMessage.create(this.channel, content, options).resolveData();

                if (ephemeral) apiMessage.data.flags = 64;
                apiMessage.data.allowed_mentions = {
                    parse: ["users", "roles", "everyone"]
                };

                const { data, files } = await apiMessage.resolveFiles();
                await this.client.api.interactions(this._data.discordID, this._data.token).callback
                    .post({
                        data: {
                            data: data,
                            type: type
                        },
                        files
                    });
                this.clickEnded = true;

            }

            /**
             * Edits an interaction reply.
             * @param {*} content
             * @param {*} options
             */
            this.editReply = async (content, options) => {

                if (!this.clickEnded) throw new Error('This interaction was not yet ended; cannot edit reply yet.');

                var output = await this._webhook.editMessage(content, options);

                return this.channel.messages.add(output);

            }

            /**
             * Sends a delayed interaction reply. The bot will be [thinking...] until the reply delivers. Supports ephemeral messages!
             * @param {*} content 
             * @param {*} ephemeral 
             * @param {*} timeout 
             * @param {*} options 
             */
            this.delayedReply = async (content, ephemeral = false, timeout = 5000, options = {}) => {
                options.reply_type = 5;
                this.reply(content, ephemeral, options);

                this._delayedReplyContent = content;

                if (!options.noTimeout) return setTimeout(() => {
                    this.editReply(this._delayedReplyContent, options);
                }, timeout);
                else return {fulfill: (val) => this.editReply(val ?? this._delayedReplyContent, options)};
            }

            /**
             * Sets the content of the current delayed interaction reply, if applicable.
             * @param {*} content
             */
            this.setDelayedReply = async (content) => {
                this._delayedReplyContent = content;
            }

            this.clickEnded = false;
        }

    }

    get user() {
      
        var user = this.client.users.resolve(this._data.member.user.id);
        user.fetch = async () => await this.client.users.fetch(this._data.member.user.id);

        return user;
        
    }
    
    get member() {
    
        var member = this.guild ? this.guild.members.resolve(this._data.member.user.id) : undefined;
        if (member) member.fetch = async () => await this.guild.members.fetch(this._data.member.user.id);

        return member;
    
    }

    get elisif() { return require("../index").getInstance(); }

}

module.exports = Interaction;