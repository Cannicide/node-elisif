//A command to allow the bot developers to execute code and determine values of variables from in Discord itself

const Command = require("../index").Command;
const evg = require("../index").evg;
const Interface = require("../index").interface;
const client = require("../index").getClient();

module.exports = new Command("eval", {
    expansion: true,
    desc: "Command to allow the bot developers to evaluate code from within Discord.",
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
    invisible: true
}, async (message) => {

    if (!client.authors) {
        message.channel.send("Error: eval command has been auto-disabled due to a missing setting. If you are the developer, please view the latest error for more information.");
        throw new Error("node-elisif error: The developers of this bot and their IDs MUST be specified during the client's creation in order to be able to use the eval command. This is because the eval command requires the Discord IDs of the developers in order to ensure that only they can user the eval command. Because the eval command can be used to run code, it is not safe for any users, apart from the bot developers, to have access to this command.");
    }

    var isDev = false;

    client.authors.forEach((dev) => {
        if ((!("id" in dev) || !dev.id) && ("username" in dev && dev.username)) console.warn(`node-elisif warning: The developer "${dev.username}" did not have their ID specified during client construction, and may be unable to use the eval command.`);
        else if (!("id" in dev) || !dev.id) console.warn("node-elisif warning: A developer listed in client construction did not have their ID specified, so they may be unable to use the eval command.");
        else if (message.author.id == dev.id) isDev = true;
    });

    if (!isDev) return message.channel.send(`Only the developers of ${client.name} can use this command!`);

    try {
        var result = eval(message.args.join(" "));
        if (typeof result === "boolean") result = "" + result; //Account for boolean responses

        if (result != "" && !(result instanceof Promise) && !message.hasFlag("-n")) await message.channel.send("```js\n" + result + "```");
    }
    catch (err) {
        message.channel.send("```js\n" + err.stack + "```");
    }

});