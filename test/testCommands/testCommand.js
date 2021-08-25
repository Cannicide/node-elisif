const { Command, util } = require("../../index");

module.exports = new Command({
    name: "zTestCommand",
    desc: "A test command",
    execute(message) {
        message.reply("Test command executed");
    }
})