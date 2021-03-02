//A command to allow me to execute code and determine values of variables from in Discord itself

const Command = require("../command");
const evg = require("../evg");
const Reactions = evg.resolve("giveaway");
const Interface = require("../interface");

const utilities = {
    drawGiveaway: (message) => {
        require("./giveaway").drawWinners(message.client, Reactions.find(element => element.type == "giveaway"));
    },
    timeToMs: (time) => {
        return require("./giveaway").convertToTime(time);
    }
}

module.exports = new Command("eval", {
    desc: "Command to allow Cannicide to evaluate code from within Discord.",
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

    if (message.author.id != "274639466294149122") return message.channel.send("Only Cannicide can use this command!");

    try {
        var result = eval(message.args.join(" "));
        if (result != "" && !(result instanceof Promise) && !(message.flags && message.flags.includes("-n"))) await message.channel.send("```js\n" + result + "```");
    }
    catch (err) {
        message.channel.send("```js\n" + err.stack + "```");
    }

});