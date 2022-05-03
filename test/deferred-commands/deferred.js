const { command } = require("../../src");

command("deferred", "A deferred test elisif command.")
.guild("668485643487412234")
.argument("<user: user>" , "A user.")
.require("@Member")
.action(i => {
    const m = i.args.user;
    return i.reply(`The user is ${m}`);
});