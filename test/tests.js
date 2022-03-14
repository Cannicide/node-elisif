require("../src");
const Client = require('../src/client/Client');
const Intent = require('../src/structures/Intent');
const { loadToken, simulateMessage } = require('../src/util');

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
    console.log("Ready!");
    if (client.simulated) simulateMessage(client, "test this", {userId: "274639466294149122"});
});

// client.extend("messageCreate", m => {
//     return [m.content];
// });

// client.extend("messageCreate", m => {
//     return [m + "!"];
// });

client.on("message", m => {
    console.log("Message", m.content);
    console.log("Words", m.words);
    console.log("Sim", m.simulated);

    if (!m.author.bot) m.reply("test reply");
});

client.login(loadToken(__dirname + "/token.json"));