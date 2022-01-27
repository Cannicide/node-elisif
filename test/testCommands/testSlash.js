const { SlashCommand, util, Discord } = require("../../index");
const { ButtonUtility } = require("../../util/ComponentUtility");

let command = new SlashCommand.SlashCommandBuilder()
.setName("testslash")
.setDescription("A test slash command.")
.setRoles(["Bot"])
.setGuilds(["668485643487412234"])
.addSubCommand(cmd => 
    cmd.setName("subcmd")
    .setDescription("A test subcommand.")
    .addChannelArg(arg => 
        arg.setName("arg1")
        .setDescription("The first argument channel")
    )
)
.addSubCommand(cmd => 
    cmd.setName("subcmd2")
    .setDescription("A 2nd test subcommand.")
    .addBooleanArg(arg => 
        arg.setName("arg2")
        .setDescription("The second argument")
    )
)
.setMethod(async slash => {
    console.log("Test slash command invoked.");

    let msg = await slash.reply("Channel ID: " + slash.getArg("arg1")?.id);

    let component = {
        elisifComponentType: "button",
        label: null,
        customId: null,
        style: null,
        emoji: null,
        url: null,
        disabled: null
    };

    let text = "Test Label";
    let color = "PRIMARY";
    let id = "testid";

    component.label = text;
    component.customId = id;
    component.style = ButtonUtility.convertColor(color);

    let btn = new Discord.MessageButton(component);
    let actionRow = new Discord.MessageActionRow();
    actionRow.addComponents(btn);
    msg.components.push(actionRow);

    component = {
        elisifComponentType: "button",
        label: null,
        customId: null,
        style: null,
        emoji: null,
        url: null,
        disabled: null
    };

    text = "Test Label 2";
    color = "PRIMARY";
    id = "testid2";

    component.label = text;
    component.customId = id;
    component.style = ButtonUtility.convertColor(color);

    btn = new Discord.MessageButton(component);
    actionRow = new Discord.MessageActionRow();
    actionRow.addComponents(btn);
    msg.components.push(actionRow);

    await slash.editReply(msg);

    msg.util.buttonHandler({
        allUsersCanClick: false,
        disableOnEnd: true,
        maxClicks: 2,
        ids: ["testid"]
    }, button => {
        button.update("Clicked 1: " + button.customId)
    });

    msg.util.buttonHandler({
        allUsersCanClick: false,
        disableOnEnd: true,
        maxClicks: 2,
        ids: ["testid2"]
    }, button => {
        button.update("Clicked 2: " + button.customId)
    });

    // console.log("Flat (array) args:", slash.flatArgs);
    // console.log("Mapped (object) args:", slash.mappedArgs.toJSON());
    // console.log(util.inspect(slash.args, { depth: null }));
});

module.exports = command.build();