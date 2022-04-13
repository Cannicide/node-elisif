require("../src");
const Client = require('../src/client/Client');
const Intent = require('../src/structures/Intent');
const { loadToken, simulateMessage, channels, button, createMessage, parseTime } = require('../src/util');

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

        channels(client, "799791153310072922").first().createMutedChannel("muted-{name}");
        
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


        await createMessage("Test")
        // .button(b => 
        //     b
        //     .customId("button1")
        //     .color(0xf2ff9b)
        //     .label("Click Me")
        //     .maxUses(2, b => b.setDisabled(true))
        //     // .maxTime("2m", b => b.setDisabled(true))
        //     .onClick(btn => {
        //         btn.reply("You clicked me!");
        //     })
        // )
        // .button({
        //     customId: "button1",
        //     color: 0xf2ff9b,
        //     label: "Click Me 2",
        //     maxTime: {
        //         time: 15000,
        //         callback: b => b.setColor(0x00ff00)
        //     },
        //     maxUses: {
        //         uses: 2,
        //         callback: b => b.setColor(0xff)
        //     },
        //     onClick: btn => {
        //         btn.reply("You clicked me!");
        //     },
        //     onEnd: b => {
        //         b.toggleDisabled();
        //     }
        // })
        .button({
            label: "Test Toggle",
            customId: "maintoggle",
            toggleRow: {
                time: 0,
                row: [
                    {
                        label: "Toggled 1",
                        customId: "toggle1",
                        color: 0x00ff00,
                        onClick: btn => {
                            btn.reply("Clicked Toggled 1");
                        }
                    },
                    {
                        label: "Toggled 2",
                        customId: "toggle2",
                        color: 0xff,
                        onClick: btn => {
                            btn.setDisabled();
                            return "noreply";
                        }
                    }
                ]
            }
        })
        .send(m.channel);
        
    }
});

// client.on("interactionCreate", i => {
//     const Interaction = require('../src/structures/Interaction');
//     const ComponentInteraction = require('../src/structures/ComponentInteraction');

//     if (i.isMessageComponent()) i = ComponentInteraction.from(i);
//     else i = Interaction.from(i);

//     console.log("Worked ", i.customId);
//     i.reply.delayed("Worked", 5000);
// });

client.login(loadToken(__dirname + "/token.json"));