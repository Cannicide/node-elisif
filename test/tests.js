require("../src");
const Client = require('../src/client/Client');
const Intent = require('../src/structures/Intent');
const { loadToken, simulateMessage, embed, createMessage, CREATE_MESSAGE_CUSTOM_METHODS } = require('../src/util');

const client = new Client(config => {
    config.intents(Intent.ALL)
    .name('Testing Bot')
    .author('Cannicide', '274639466294149122')
    .debug()
    .description('A bot for testing')
    .presences(["Hyelp", "Trelp"], 5)
    // .simulation()
});

client.on("ready", async () => {
    client.debug("Ready!");
    // client.debug(client);
    if (client.simulated) simulateMessage(client, "test this", {userId: "274639466294149122"});
    else {
        await client.user.setActivity(builder => {
            builder.name("Apex")
            .type.streaming("https://twitch.tv/cannicide")
        });
    }
});

client.on("message", /** @param {import("../src/structures/Message")} m */ async m => {
    // console.log("Message", m.content);
    // console.log("Words", m.words);
    // console.log("Sim", m.simulated);

    if (!m.author.bot) {

        // m.reply(`
        //     Test reply
        //     M created: ${m.created}
        //     U created: ${m.author.created}
        //     U banner: ${await m.author.profile.banner()}
        //     U has banner: ${await m.author.profile.hasBanner()}
        //     U avatar: ${m.author.profile.avatar()}
        //     U has avatar: ${m.author.profile.hasAvatar()}
        //     U is client: ${m.author.isClient()}
        //     C is client: ${m.client.user.isClient()}
        //     U is bot: ${m.author.bot}
        //     C is bot: ${m.client.user.bot}
        //     U has FAKE perm: ${m.member.permissions.hasStrict("FAKE")}
        //     U has Member and Bot Developer roles: ${m.member.roles.has("Member", "Bot Developer")}
        //     U has Member and Fake roles: ${m.member.roles.has("Fake", "Member")}
        //     U has Member or Fake roles: ${m.member.roles.any("Fake", "Member")}
        //     U has none of Fake and Fake2 roles: ${m.member.roles.none("Fake", "Fake2")}
        // `);

        m.channel.send("Channel: " + m.channel.channelOf({ content: "fake" }));

        // CREATE_MESSAGE_CUSTOM_METHODS.blockQuote = function(str) {
        //     this.messageData.content ??= "";
        //     this.messageData.content += "\n> " + str;
        //     return this;
        // }

        // const g = embed("Some content")
        // .description("A desc")
        // .title("A title")
        // // .debug();
        // .get();

        // createMessage("A test content from builder")
        // .embed(g)
        // .blockQuote("A block quote")
        // .send(m.channel);

    }
});

client.login(loadToken(__dirname + "/token.json"));