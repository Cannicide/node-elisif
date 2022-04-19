const {
    Client,
    Intent,

    loadToken,
    simulateMessage,
    channels,
    createMessage,
    modal,
    command,
    commandAutocompleter,
    contextMenu,
    ion
} = require("../src");

const client = new Client(config => {
    config.intents(Intent.ALL)
    .name('Testing Bot')
    .author('Cannicide', '274639466294149122')
    .debug()
    .description('A bot for testing')
    .presences(["Hyelp", "Trelp"], 5)
    // .simulation()
});

modal("tmodal800")
.setTitle("Test Modal")
.addComponent({
    customId: "maininput",
    label: "The Main Input",
    max: 10
})
.addComponent({
    customId: "maininput2",
    label: "The Main Input 2",
    multiline: true
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

        m.channel.send("Channel: " + m.channel.channelOf({ content: "fake" }));

        const a = await createMessage("Test")
        // .button({ // To test ION
        //     label: "An ION Button",
        //     customId: "ionbtn"
        // })
        .button({
            label: "⭐ Test Toggle",
            customId: "maintoggle",
            toggleRow: {
                time: "30s",
                row: [
                    {
                        label: "Toggled 1",
                        customId: "toggle1",
                        color: 0x00ff00,
                        onClick: async btn => {
                            const i = await btn.openModal("tmodal800", "10s", f => f.reply("Nah"));

                            if (!i) return console.log("Failed to submit modal.");

                            console.log("Submitted", i.values.toArray());
                            console.log("First by get", i.values.get(0));
                            console.log("First", i.values[0]);
                            console.log("By id", i.values.get("maininput"));
                            console.log("By property reference", i.values.maininput);
                            console.log("2nd by get", i.values.get(1));
                            console.log("2nd", i.values[1]);
                            console.log("2nd by id", i.values.get("maininput2"));
                            console.log("2nd by property reference", i.values.maininput2);
                            i.reply("> Test reply to **you**, sir");
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
            },
            // acceptsClicksFrom: ["Member"]
        })
        .selectMenu({
            placeholder: "Select Me",
            customId: "selectmenu",
            onSelect: s => {
                s.reply("Selected: " + s.selected)
            },
            options: [
                "Taco 1",
                "Taco 2",
                {
                    label: "⭐ Taco 3",
                    description: "Very taco-y",
                    value: "tacoette"
                }
            ],
            max: 2,
            maxUses: {
                uses: 2,
                callback: s => s.toggleDisabled()
            },
            // acceptsSelectionsFrom: ["668496738511749155"]
        })
        .send(m.channel);

        // Test adding ION:
        // ION.add("testNamespace", a.id, ["ionbtn"]);
        
    }
});


// TEST COMMANDS:

command("hapax", "A test elisif command.")
.guild("668485643487412234")
.argument("[frst]" , "The first argument.", commandAutocompleter(["Option A", "Choice B", "Selection C"]))
.require("@Member")
.action(i => {
    if (i.args.frst == "Choice B") return i.reply("Are you not entertained?");
    i.reply("A response.");
});

contextMenu("Reply To")
.type("Message")
.guild("668485643487412234")
.action(async i => {
    const m = await i.openModal("tmodal800");
    m.reply("You wrote: " + m.values[0]);
});

// Test ION:
const ION = ion(client, __dirname + "/db.sifdb");

ION("interactionCreate", "testNamespace", i => {
    if (!i.isButton()) return;
    i.reply("You clicked testNamespace button: " + i.label);
});

ION.off("messageDelete", "testNamespace", m => {
    console.log("DELETED a testNamespace message.");
});

client.login(loadToken(__dirname + "/token.json"));