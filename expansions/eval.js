//A command to allow the bot developers to execute code and determine values of variables from in Discord itself

const { ExpansionCommand: Command, evg, Interface, util } = require("../index");

module.exports = new Command("eval", (client, _settings) => ({
    expansion: true,
    name: "eval",
    desc: "Command to allow the bot developers to evaluate code from within Discord.",
    devs_only: true,
    args: [
        {
            name: "code",
            feedback: "Please specify some code to evaluate."
        },
        {
            name: "n",
            flag: "Disable the output of the code."
        }
    ],
    invisible: true,
    async execute(message) {

        const msgutil = util.Message(message);
        var output_used = message.content.match(/([^a-zA-Z0-9."']|^)output\(/gm);

        if (!client.authors) {
            message.channel.send("Error: eval command has been auto-disabled due to a missing setting. If you are the developer, please view the latest error for more information.");
            throw new Error("node-elisif error: The developers of this bot and their IDs MUST be specified during the client's creation in order to be able to use the eval command. This is because the eval command requires the Discord IDs of the developers in order to ensure that only they can user the eval command. Because the eval command can be used to run code, it is not safe for any users, apart from the bot developers, to have access to this command.");
        }

        client.authors.forEach((dev) => {
            if ((!("id" in dev) || !dev.id) && ("username" in dev && dev.username)) console.warn(`node-elisif warning: The developer "${dev.username}" did not have their ID specified during client construction, and may be unable to use the eval command.`);
            else if (!("id" in dev) || !dev.id) console.warn("node-elisif warning: A developer listed in client construction did not have their ID specified, so they may be unable to use the eval command.");
        });

        const output = async (result) => {

            output_used = true;
            if (typeof result === "boolean" || typeof result === "number" || result == undefined) result = "" + result; //Account for boolean/num/undefined responses
            if (result.toString() == "[object Object]") result = JSON.stringify(result);
            if (result == "") result = '""';

            if (!(result instanceof Promise) && !msgutil.hasFlag("-n")) await message.channel.send("```js\n" + result + "```");
            else if (result instanceof Promise && !msgutil.hasFlag("-n")) output(await result);

        }

        try {
            var result = eval(`(async () => {${(msgutil.args.length == 1 ? "return " : "") + msgutil.args.join(" ")}})()`);
            if (!output_used) await output(result);
        }
        catch (err) {
            message.channel.send("```js\n" + err.stack + "```");
        }

    }
}));