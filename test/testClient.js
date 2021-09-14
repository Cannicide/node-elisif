
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

client.setting("debug_mode", false);

//Setup points system in test guild
//This value can be set by guild owners via commands!
// client.settings.Local("668485643487412234").set("points.enabled", true);

//Print version of node-elisif
console.log("Started node-elisif v" + version);

//Syntax testing
// let syntax = "acommand subcmd [optional arg] <mandatory option; A mandatory option> (-f flag name; Flag desc) [variadic option...]";
// let argSyntax = "<mandatory option; A mandatory option> [variadic option...]"
// let cmd = 'acommand subcmd "optional value" mandatory -f "flag value" variadic values over here yeehaw'
// console.log(`Values: ${util.Syntax.parser.parse(syntax, cmd).values.args.map(val => JSON.stringify(val))}`);
// console.log(`Comps:`, util.Syntax.parser.components(syntax).map(val => JSON.stringify(val)));
// console.log(`Args:`, util.Syntax.parser.components(argSyntax).map(val => JSON.stringify(val)));

//Only login when actually testing
if (require("fs").existsSync(__dirname + "/token.json")) client.login(require("./token.json").token);
else process.exit();