const { SlashCommand, util } = require("../../index");

let command = new SlashCommand.SlashCommandBuilder()
.setName("testslash")
.setDescription("A test slash command.")
.setRoles(["Bot"])
.setGuilds(["668485643487412234"])
.addSubGroup(group => 
    group.setName("group")
    .setDescription("A test subgroup.")
    .addSubCommand(cmd => 
        cmd.setName("subcmd")
        .setDescription("A test subcommand.")
        .addStringArg(arg => 
            arg.setName("arg1")
            .setDescription("The first argument")
            .addChoices(["choice1", "choice2"])
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
)
.addSubGroup(group => 
    group.setName("groupb")
    .setDescription("Another test subgroup.")
    .addSubCommand(cmd => 
        cmd.setName("subcmd3")
        .setDescription("A 3rd test subcommand.")
        .addStringArg(arg => 
            arg.setName("arg3")
            .setDescription("The third argument")
        )
    )
    .addSubCommand(cmd => 
        cmd.setName("subcmd4")
        .setDescription("A 4th test subcommand.")
        .addBooleanArg(arg => 
            arg.setName("arg4")
            .setDescription("The fourth argument")
        )
        .addFloatArg(arg => 
            arg.setName("arg5")
            .setDescription("The fifth argument")
            .setOptional(true)    
        )
    )
)
.setMethod(async slash => {
    console.log("Test slash command invoked.");
    console.log("Flat (array) args:", slash.flatArgs);
    console.log("Mapped (object) args:", JSON.stringify(Object.fromEntries(slash.mappedArgs.entries())));
    // console.log(util.inspect(slash.args, { depth: null }));
});

module.exports = command.build();