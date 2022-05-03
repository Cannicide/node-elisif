const { command } = require("../../src");

command("hapax", "A test elisif command.")
.guild("668485643487412234")
.argument("<frst: voice_OrTextChannel>" , "The first argument.")
.require("@Member")
.action(i => {
    const m = i.args.frst;
    // return i.reply({
    //     content: "Replied",
    //     files: [m]
    // });
    return i.reply(`The channel is ${m}`);
});