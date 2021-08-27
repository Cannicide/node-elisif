const { SlashCommand, util } = require("../../index");

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
    slash.reply("Channel ID: " + slash.getArg("arg1")?.id);
    // console.log("Flat (array) args:", slash.flatArgs);
    // console.log("Mapped (object) args:", slash.mappedArgs.toJSON());
    // console.log(util.inspect(slash.args, { depth: null }));
});

module.exports = command.build();