const util = require("minecraft-server-util");
const ping = util.status;
var Command = require("../command");

function getServerInfo(callback, err) {

    var info = {
        players: 0,
        icon: "",
        version: "",
    }

    ping(process.env.SERVER_IP)
        .then((response) => {
            info.players = response.onlinePlayers;
            info.icon = response.favicon;
            info.version = response.version;
            return callback(info);
        })
        .catch((error) => {
            console.log(error);
            if (err) err();
        });
}

var stats = new Command("statistics", {
    desc: "View discord and minecraft server statistics.",
    cooldown: 30,
    aliases: ["stats"]
}, (message) => {

    getServerInfo((info) => {

        var memOnline = message.guild.members.cache.filter(m => m.presence.status != 'offline').size;
        var memTotal = message.guild.memberCount;
        var memPercent = memOnline / memTotal * 100;

        message.channel.embed({
            title: "**Statistics**",
            thumbnail: message.guild.iconURL({dynamic: true}),
            fields: [
                {
                    name: "Minecraft Server",
                    value: `Players Online: ${info.players}\nVersion: 1.8.x-1.12.x`
                },
                {
                    name: "Discord Server",
                    value: `Total Member Count: ${memTotal} users\nTotal Online Members: ${memOnline}\nPercent of Members Online: ${Math.round(memPercent)}%`
                }
            ]
        });

    }, (err) => {

        message.channel.embed({
            desc: "The server appears to be down.",
            title: "**Statistics**",
            thumbnail: message.guild.iconURL({dynamic: true})
        });

    });

        

});

//Scheduler automatically updates parts of the discord with minecraft/guild info and stats
function scheduler(client) {

    const ip = process.env.SERVER_IP;
    const port = Number(process.env.RCON_PORT);
    const password = process.env.RCON_PASSWORD;

    const rcon = new util.RCON(ip, { port: port, enableSRV: true, timeout: 5000, password: password });
    const guild = client.guilds.cache.get("717160493088768020");

    rcon.on('output', async (message) => {
        //Remove color codes
        message = message.replace(/§[0-9a-f]{1}/g, "");
        var online = message.split(" out of")[0].replace("There are ", "");
        var vanished = 0;

        var msg = false;
        const category = guild ? guild.channels.cache.get("753387453108453457") : false;

        if (online.match("/")) {
            vanished = online.split("/")[1];
            online = online.split("/")[0];
        }

        const oldChannel = category.children.first();

        if (guild && oldChannel && online) msg = `${online} ${Number(online) == 1 ? "person is" : "people are"} on Scav.tv!`;
        if (oldChannel && msg && oldChannel.name != msg) {
            const channel = await oldChannel.clone({name: msg}); 
            oldChannel.delete();
        }
        
    });

    rcon.connect()
    .then(() => {
        console.log('Connected to RCON')

        //15-second statistics scheduler
        setInterval(async () => {
          try {
            await rcon.run("online");
          }
          catch(err) {
            rcon.connect().catch(console.log);
            console.log("Reconnected to RCON");
          }
        }, 15 * 1000);
    })
    .catch(console.log);

}

module.exports = {
    command: stats,
    scheduler: scheduler
}