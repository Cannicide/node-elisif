# Sample Command

This is a sample command file. In the Elisif command-handling system, all commands are contained inside a specific folder. A single file in the commands folder can contain one or more commands. A command is represented by the `Command` class, and each command has several easily configurable options.

## Single Command Example

```js
const { Command } = require('elisif');
module.exports = new Command("ping", {
    desc: "An example ping command." //Sets the description of the command. Can be used in "help" commands.
}, async message => {

    message.channel.send("Pong!");

});
```

## Multiple Command Example

```js
const Command = require('elisif').Command;
module.exports = {
    commands: [

        new Command("ping", {
            desc: "An example ping command."
        }, async message => {
            message.channel.send("Pong!");
        }),

        new Command("pong", {
            desc: "An example pong command."
        }, async message => {
            message.channel.send("Ping!");
        }),

        new Command("anotherexample", {
            desc: "Another example command.",
            args: [{
                name: "arg-name", //Name of the first arg, args[0]
                optional: false, //Makes this arg required
                feedback: "You did not specify the argument!" //Message sent when arg is not provided by user
            }]
        }, async message => {

            let arg = message.getArg(0);
            /*
                Alternate methods of getting the argument:
                - let arg = message.args[0];
                - let arg = message.getArg("arg-name");
            */

            message.channel.send(`You specified the argument: ${arg}!`);
        })

    ]
};
```

## Command Initialization Example

When using the multiple command structure above, you can define an `initialize()` method that will be run when all commands are initialized on bot startup.

```js
const { Command } = require('elisif');
var someVariable = "old value";

module.exports = {
    commands: [
        new Command("ping", {
            desc: "An example ping command."
        }, async message => {
            message.channel.send("Pong! " + someVariable);
        })
    ],

    initialize(client) {
        someVariable = "new value";
        console.log(`Initialized the ping command for bot: ${client.name}.`);
    }
}
```

## Dynamic Command Options

If you want to be able to set the value of a command configuration option dynamically, you can use getter methods to do so.

```js
const { Command } = require('elisif');
module.exports = new Command("dynamicdescription", {
    //Represents the 'desc' option
    get desc() {
        var description = "";
        for (var i = 0; i < 10; i++) description += "Test ";
        return description;
    }
}, async message => {
    //Get this Command object from the extended message
    var cmd = message.getCommand();

    //Get the command's description
    var desc = cmd.desc;

    message.channel.send(`Command description: ${desc}`);
});
```