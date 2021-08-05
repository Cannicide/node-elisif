# Sample Slash Command

This is a sample slash command file. Slash commands work very similarly to regular commands in the Elisif system. A single file in the commands folder can contain one or more slash commands. A slash command is represented by the `SlashCommand` class, and each slash command has several easily configurable options. However, due to the nature of slash commands, they have fewer options than regular commands.

## No Arguments Example

```js
const SlashCommand = require('elisif').SlashCommand;

module.exports = new SlashCommand("ping", {
    desc: "A simple ping command."

    /*
        If you want to publish this slash command to a specific guild(s) instead of globally, specify guilds with the 'guilds' property.
        Discord rolls out guild slash commands immediately, but global slash commands may take up to an hour to be published/updated.
    */
    // guilds: ["668485643487412234"]
}, async slash => {
 
    //Slash interactions must be fulfilled by a reply.
    //A deferred reply can also be used instead.
    slash.reply(`PONG!`);

});
```

## Regular Arguments Example

This example makes use of the `ArgumentBuilder` utility class, which makes it easier to construct the complex structure of an argument. Use of this utility is optional; if you so choose, you can provide a plain javascript object literal instead. 

```js
const SlashCommand = require('elisif').SlashCommand;
const { ArgumentBuilder } = SlashCommand;

module.exports = new SlashCommand("ping", {
    desc: "A simple ping command with a single argument.",
    args: [
        new ArgumentBuilder()
        .setName("arg name")
        .setDescription("An argument description")
        //Possible types: "string", "str", "integer", "int", "boolean", "bool", "user", "channel", "role", "mention", "float"
        .setType("string")
        .setOptional(true)
    ]

    /*
        If you want to publish this slash command to a specific guild(s) instead of globally, specify guilds with the 'guilds' property.
        Discord rolls out guild slash commands immediately, but global slash commands may take up to an hour to be published/updated.
    */
    // guilds: ["668485643487412234"]
}, async slash => {

    let arg = slash.getArg(0);
    /*
        Alternate methods of getting the argument value, similar to regular commands:
        - let arg = slash.args_classic[0];
        - let arg = slash.getArg("arg name");
        - let arg = slash.getArg(0, true);
        - let arg = slash.args_object["arg name"]
        - let arg = slash.varargs[0]

        Arguments can also be retrieved in a raw form similar to Discord's slash argument data structure:
        - let arg = slash.args[0];
    */
 
    //Slash interactions must be fulfilled by a reply.
    //A deferred reply can also be used instead.
    slash.reply(`PONG! Argument: ${arg}`);

});
```

## Subcommand Example 

This example makes use of the `SubCommandBuilder` utility class, which makes it easier to construct the complex structure of a subcommand argument. Use of this utility is optional; if you so choose, you can provide a plain javascript object literal instead.

```js
const SlashCommand = require('elisif').SlashCommand;
const { ArgumentBuilder, SubCommandBuilder } = SlashCommand;

module.exports = new SlashCommand("ping", {
    desc: "A simple ping command with a single argument.",
    args: [
        new SubCommandBuilder()
        .setName("sub1")
        .setDescription("Subcommand description")
        .addArgument(
            new ArgumentBuilder()
            .setName("arg1")
            .setDescription("First argument description")
            .setType("string")
        )
        .addArgument(
            new ArgumentBuilder()
            .setName("arg2")
            .setDescription("Second argument description")
            .setType("string")
        )
    ]
}, async slash => {

    let subcommand = slash.getArg("sub1");
    let arg1 = slash.getArg("arg1");
    let arg2 = slash.getArg("arg2");
 
    //Slash interactions must be fulfilled by a reply.
    //A deferred reply can also be used instead.
    slash.reply(`PONG! Subcommand: ${subcommand}\nArg 1: ${arg1}\nArg 2: ${arg2}`);

});
```

## Subgroup Example 

This example makes use of the `SubGroupBuilder` utility class, which makes it easier to construct the complex structure of a subgroup argument. Use of this utility is optional; if you so choose, you can provide a plain javascript object literal instead.

```js
const SlashCommand = require('elisif').SlashCommand;
const { ArgumentBuilder, SubCommandBuilder, SubGroupBuilder } = SlashCommand;

module.exports = new SlashCommand("ping", {
    desc: "A simple ping command with a single argument.",
    args: [
        new SubGroupBuilder()
        .setName("group1")
        .setDescription("Subgroup description")
        .addSubCommand(
            new SubCommandBuilder()
            .setName("sub1")
            .setDescription("Subcommand description")
            .addArgument(
                new ArgumentBuilder()
                .setName("arg1")
                .setDescription("First argument description")
                .setType("string")
            )
            .addArgument(
                new ArgumentBuilder()
                .setName("arg2")
                .setDescription("Second argument description")
                .setType("string")
            )
        )
        .addSubCommand(
            new SubCommandBuilder()
            .setName("sub2")
            .setDescription("Subcommand description")
            .addArgument(
                new ArgumentBuilder()
                .setName("arg3")
                .setDescription("Third argument description")
                .setType("string")
            )
            .addArgument(
                new ArgumentBuilder()
                .setName("arg4")
                .setDescription("Fourth argument description")
                .setType("string")
            )
        )
    ]
}, async slash => {

    let subgroup = slash.subgroup;
    let subcommand = slash.subcommand;
    let arg1 = slash.getArg(2);
    let arg2 = slash.getArg(3);
 
    /*
        Sends a delayed reply.
        Shows a "thinking..." message for 5 seconds (5000 milliseconds) and then sends the specified message.
    */
    slash.delayedReply(`PONG! Subgroup: ${subgroup}\nSubcommand: ${subcommand}\nArg 1: ${arg1}\nArg 2: ${arg2}`, false, 5000);

});
```

## Slash Command Builder Example

This example makes use of the `SlashCommandBuilder` utility class, which makes it easier to construct a slash command.

This builder is also useful for creating and setting up slash commands easily after all other slash commands have been initialized, or to prepare a slash command and its options well before setting it up later. However, these additional uses for the builder are not demonstrated in this example. In upcoming updates, this builder will be used (by expansions) to allow configuration of whether expansions use regular commands or slash commands.

```js
const SlashCommand = require('elisif').SlashCommand;
const { ArgumentBuilder, SlashCommandBuilder } = SlashCommand;

let builder = new SlashCommandBuilder("ping", null, async slash => {

    let arg = slash.getArg(0);
 
    //Slash interactions must be fulfilled by a reply.
    //A deferred reply can also be used instead.
    slash.reply(`PONG! Argument: ${arg}`);

})
.setDescription("A simple ping command with a single argument.")
.addArgument(
    new ArgumentBuilder()
    .setName("arg name")
    .setDescription("An argument description")
    .setOptional(true)
);

module.exports = builder.build();
```

## Dynamic Guilds Example (UNTESTED)

This is a theoretical, untested example of how slash commands could be configured in all guilds cached by discord.js. This example makes use of dynamic command options.

If your bot is in more than 9-10 servers, I would **not recommend trying to use this** example code; use global slash commands (accomplished by not specifying any guilds) instead. Discord recommends using global slash commands for deploying commands for all of your users to use, and using guild slash commands (solely to your bot testing server) when you want to test your commands.

```js
const SlashCommand = require('elisif').SlashCommand;
const client = require('elisif').getClient();

module.exports = new SlashCommand("ping", {
    desc: "A simple ping command.",
    get guilds() {
        return client.guilds.cache.map(guild => guild.id);
    }
}, async slash => {
 
    //Slash interactions must be fulfilled by a reply.
    //A deferred reply can also be used instead.
    slash.reply(`PONG!`);

});
```