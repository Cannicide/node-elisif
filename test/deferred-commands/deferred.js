const { command } = require("../../src");

command("deferred", "A deferred test elisif command.")
.guild("schmluck")
.argument("<user: user>" , "A user.")
.require("@Member")
.action(i => {
    const m = i.args.user;
    return i.reply(`The user is ${m}`);
});