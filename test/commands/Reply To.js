const { contextMenu } = require("../../src");

contextMenu("Reply To")
.type("Message")
.guild("668485643487412234")
.action(async i => {
    const m = await i.openModal("tmodal800");
    m.reply("You wrote: " + m.values[0]);
});