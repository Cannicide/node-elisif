
const { Client, util, version } = require("../index");
const client = new Client({
    intents: util.getAllIntentEnums(),
    name: "Test Bot",
    presences: ["A test presence", "Another presence"],
    prefix: "^",
    port: 8000,
    autoInitialize: {
        enabled: true,
        path: __dirname + "/testCommands"
    },
    authors: [
        {
          username: "Cannicide",
          id: "274639466294149122"
        }
    ],
    description: "A test description",
    expansions: {
      enable: ["help", "eval", "games", "points", "vca"],
      help: {
        useReactions: false // Default value, here simply as an easily modifiable example
      },
      games: {
        trivia: {
          cheat: true // Default value when "debug mode" is enabled, here simply as an easily modifiable example
        }
      },
      points: {
        guilds: ["668485643487412234"],
        leaderboard: {
          inline: true
        }
      }
    }
});

client.setting("debug_mode", true);

//Setup points system in test guild
//This value can be set by guild owners via commands!
// client.settings.Local("668485643487412234").set("points.enabled", true);

//Print version of node-elisif
console.log("Started node-elisif v" + version);

//Only login when actually testing
if (false) client.login(require("./token.json").token);