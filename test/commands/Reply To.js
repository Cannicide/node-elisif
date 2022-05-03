const { contextMenu } = require("../../src");

contextMenu("Reply To")
.type("Message")
.guild("chateausis")
.action(async i => {
    const m = await i.openModal("tmodal800");
    m.reply("You wrote: " + m.values[0]);
});