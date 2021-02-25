const Handler = require("./handler");
const intents = ["GUILDS", "GUILD_MEMBERS", "GUILD_BANS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "DIRECT_MESSAGES", "GUILD_PRESENCES"];
const client = new Handler.Client({
    intents: intents,
    name: "Scav Discord Bot",
    presences: ["Raiding Bases", "KoTH", "FFA", "No McMMO", "/help", "/help", "/help", "/help"],
    logs: {
        guildID: "668485643487412234",
        channelName: "logs"
    }
});

var Interpreter = require("./interpreter");
const fetch = require("node-fetch");
const Interface = require("./interface");

//Setup website
require("./website").setup(Handler.express, client);

//Setup moderation events
var moderation = require("./commands/moderation");
moderation.moderation.keepPermabanned(client);
moderation.moderation.keepMuted(client);

//Log guild joins
client.on('guildCreate', guild => {
    client.logs.send("Scav Discord Bot was added to the guild: " + guild.name);
});

//Initialize everything on bot ready
client.once('ready', () => {
    console.log('Scav Discord Bot is up and running!');

    client.logs.edit("751504541756817481", "Scav Discord Bot is up and running again on the optimal port.\nAs of: " + new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}) + " EST");
    
    //Initialize command handler
    client.commands.initialize("commands");

    //Fetch reaction interpreters:
    Interpreter.initialize(client);

    //Setup suggestion reactions:
    Interpreter.register({
        type: "message",
        filter: (m, args) => args[0].toLowerCase().match("suggestion:") && m.channel.name.toLowerCase().match("suggestions"),
        response: (message) => {
            message.react("713053971757006950")
            .then(r => {
                message.react("713053971211878452");
            });
        }
    });

    //Setup sharetext txt file to paginated embed feature:
    Interpreter.register({
        type: "message",
        filter: (m) => m.guild && m.attachments && m.attachments.first() && m.attachments.first().name.endsWith(".txt") && m.member && m.member.roles.cache.find(x => x.name == "Staff"),
        response: (message) => {
            var url = message.attachments.first().url;

            new Interface.ReactionInterface(message, `Hello **${message.author.username}**! I've detected a TXT file named *\`${message.attachments.first().name}\`* in the message you just sent. Would you like to view its contents within Discord?`, ["✅", "669928674119778304"], (menu, reaction) => {

                if (reaction.emoji.name == "✅") {

                    fetch(url).then(response => response.buffer())
                    .then(buffer => {

                        var text = Buffer.from(buffer).toString("utf8");
                        var elements = [];
                        var count = 0;
                        var page = "";

                        for (var letter of text.split("")) {

                            count+=letter.length;
                            if (count < 500) page += letter;
                            else {
                                elements.push({
                                    name: "** **",
                                    value: page,
                                    inline: false
                                });

                                count = 0;
                                page = "";
        
                            }
                        
                        }

                        if (!elements.find(elem => elem.value == page)) elements.push({
                            name: "** **",
                            value: page,
                            inline: false
                        });

                        var embed = new Interface.Embed(message, {
                            title: message.attachments.first().name,
                            desc: "*__Preview of txt file__*\n\n** **",
                            fields: elements
                        });

                        new Interface.Paginator(message, embed, elements, 1);
                        menu.delete({timeout: 1000});

                    }).catch((err) => {

                        message.channel.send(`An error occurred:\n\`\`\`js\n${err.stack}\`\`\``);
                        console.log("An error occurred: " + err.stack);

                    });

                }
                else {
                    menu.edit("Okay, I won't display the contents of the TXT file here.");
                    menu.delete({timeout: 3000});
                }

            });

        }
    });

    //Setup requirement of using suggestion reactions in suggestion channels:
    Interpreter.register({
        type: "message",
        filter: (m, args) => !args[0].toLowerCase().match("suggestion:") && m.channel.name.toLowerCase().match("suggestions") && !m.member.roles.cache.find(x => x.name == "Staff"),
        response: (message) => {

            var Embed = Interface.Embed;
            var funSuggestions = [
                "Try to blame Music4lity more",
                "Rename Strayyamate to Streeyamate",
                "Avoid using #BlameJay anywhere",
                "Change the IP to scav.computer because TVs are irrelevant",
                "Promote Music to Head-Head Owner",
                "Rename Saturday to Scyxer Day",
                "Remove Herobrine",
                "Change the server version to Minecraft Alpha or else"
            ];

            var sugg = funSuggestions[Math.floor(Math.random() * funSuggestions.length)];

            message.channel.send(new Embed(message, {
                desc: `Hello ${message.author.tag},\n**Please use the format \`Suggestion: <your suggestion>\` to make suggestions**.\n\nExample:\n\`\`\`fix\nSuggestion: ${sugg}\n\`\`\`\n\nTo make it easier to read through suggestions and avoid clogging up suggestion channels, please take all discussion of suggestions to the general discussion channels.`
            }))
            .then(m => {
                m.delete({timeout: 15000});
            });

            message.delete({timeout: 250});
        }
    });

    //Register Sibyll interpreter:
    const sibyll = require("./sibyll/sibyll");
    Interpreter.register({
        type: "message",
        filter: (message) => message.mentions.members.first() && message.mentions.members.first().id == "751503579457519656",
        response: (message) => {
            var input = message.content.substring(message.content.indexOf(" ") + 1);

            if (input == "" || input == " " || !input || input.startsWith("<@")) return;

            input = input.replace(/\@everyone/gi, "[@]everyone").replace(/\@here/gi, "[@]here");

            sibyll.respond(input).then((output) => {

                message.channel.send(output);

            });
        }
    });

    // //Register poll interpreters:
    // const polls = require("./commands/poll");
    // polls.initialize();

    // //Register checklist interpreters:
    // const checklists = require("./commands/checklist");
    // checklists.initialize();

    //Setup DiscordSRZ
    const DiscordSRZ = require("./discordsrz");
    DiscordSRZ.initialize(client);

    //Setup statistics logger and scheduler
    var statistics = require("./commands/statistics");
    statistics.scheduler(client);

    //Setup giveaway scheduler
    require("./commands/giveaway.js").giveawayScheduler(client);

});

//Setup message event listener
client.on('message', message => {
    try {

        // Avoid bot messages, DM and otherwise:
        if (message.author.bot) return false;

        // DM determination:
        if (message.guild === null) {
            
            //Interpret for DiscordSRZ code
            Interpreter.handleDm(message, message.content.split(" "));

            return false;
        }

        //Handle command:
        var cmd = client.commands.handle(message);

        //Handle messages to be interpreted:
        if (!cmd) {
            Interpreter.handleMessage(message, message.content.split(" "));
        }

    }
    catch (err) {
        message.channel.send(`Errors found:\n\`\`\`${err}\nAt ${err.stack}\`\`\``);
    }
});

client.on("messageReactionAdd", (r, user) => {
    Interpreter.handleReaction(r, user, true);
});

client.on("messageReactionRemove", (r, user) => {
    Interpreter.handleReaction(r, user, false);
});

//Added token
client.login(process.env.TOKEN);