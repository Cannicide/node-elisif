const { APIMessage, WebhookClient } = require("discord.js");

class InteractionWebhookClient extends WebhookClient {

    async editMessage(content, options) {

        var api = APIMessage.create(this, content, options).resolveData();

        const { data, files } = await api.resolveFiles();

        return this.client.api
            .webhooks(this.id, this.token)
            .messages("@original")
            .patch({ data, files });
    }

}

module.exports = InteractionWebhookClient;