# node-elisif v4
[![Node Package](https://github.com/Cannicide/node-elisif/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Cannicide/node-elisif/actions/workflows/npm-publish.yml) [![NPM Version](https://img.shields.io/npm/v/elisif?maxAge=2400)](https://www.npmjs.com/package/elisif) [![NPM Downloads](https://img.shields.io/npm/dt/elisif?maxAge=2400)](https://www.npmjs.com/package/elisif)

[![NPM Badge](https://nodei.co/npm/elisif.png?downloads=true&stars=true)](https://nodei.co/npm/elisif)

A powerful Discord Bot system, slash command handler, and complete extension of discord.js designed to be both simplistic and feature-rich. More powerful, efficient, and simplified than any of its predecessor versions.
## Information
Completely rewritten with new, improved, better code. Far more effective than the previous version of node-elisif, and built with complete support for discord.js v13 and all of its features. That includes support for threads and all message components. Even newer discord features such as modals (fully supported in node-elisif despite not yet being supported by discord.js), voice channel activities (VCA), and dynamic timestamps are also supported. For purposes of simplicity, some structures and managers extended by node-elisif may even mirror old properties from discord.js v11 or v12, potentially helping developers upgrade to newer versions of discord.js without needing to make as many changes.

Note that, because this version is a complete rewrite of node-elisif, code using the previous version will not work if updated to this version. The list of breaking changes is immense, as quite literally *everything* was rewritten. All of the code from the previous version of node-elisif was thrown out, and this version was redesigned and coded from scratch. The base systems powering everything are entirely different, and this version extends many of the structures in discord.js whereas the previous version extended only 4-5 structures. Only some code from the `elisif-simple` package has been reused in this rewrite.

The node-elisif command handler is now solely built to work with slash commands, embracing Discord bots' future as interaction-based systems. The command handler makes creating commands incredibly easy, with support for the utilization of simple, already well-known syntax when defining command arguments. The command handler automatically handles creating the JSON data for commands, determining whether the commands should be added to a guild or globally, adding the commands to the determined destination, auto-removing non-existent/deleted commands, managing autocompletion of specific command arguments, and executing the respective callback functions of all defined commands. It also facilitates accessing argument data when a command has been executed, providing an `interaction.args` property that simultaneously behaves like an Array, Map, and Object all at once.

The node-elisif extended `Client` also provides a simple way to extend individual events. Event extensions allow developers to further extend node-elisif by intercepting event handlers, running their own custom event code, and even replacing the returned structures with their own extended structures. In fact, node-elisif itself uses this system to extend the default discord.js events to use node-elisif's extended structure classes (e.g. returning an extended `Message` structure instead of the default discord.js `Message` on `messageCreate`).

Expansions, or completely coded bot systems such as economy/moderation/utility that can work directly on your bot with a bit of configuration, will also be released in the future. Some of the old expansions that were in development for the previous version of node-elisif will still continue to be worked on, though not much progress was made on them before, and what little progress was made will need to be rewritten to work with the current version of node-elisif. Some or all of these expansions will probably also land themselves in a separate package. One such expansion is a moderation expansion that will include fancy buttons, alerts, punishment methods, auto-moderation, and more. Just like the previous version, this version of node-elisif will also strive to allow other developers to easily create their own expansion packages.

No documentation currently exists for this version of the module, apart from the incomplete jsdocs documentation of individual methods and properties directly within the code. A full documentation website will be generated only after this version of the package is completed, fully documented via jsdocs and typescript, and properly released.

## Usage
This version of the package has not been fully released yet, and is not stable. Some features remain incomplete, some others have not been added to the package yet, and some of the current features have not been thoroughly tested. Use at your own risk.

Install node-elisif:
```
npm install elisif@4.0.0-dev
```

As of this version (v4), node-elisif supports both CJS and ESM importation. Import the package:
```js
// Using CJS:
const Elisif = require('elisif');

// Or using ESM:
import Elisif from 'elisif';

// Or using CJS individual imports:
const { Client, ClientConfig, Intent } = require('elisif');

// Or using ESM individual imports:
import { Client, ClientConfig, Intent } from 'elisif';
```

To create the bot, use `Client`. It works the same as a regular discord.js client, but with slightly different construction. It is ~~currently required to use a builder function or `ClientConfig` object as the argument to the `Client` constructor in order to create a bot client~~ (as of v4.0.10-dev, a plain object literal can now be used as well; in the below example, simply remove the config constructor that is wrapped around the object literal). Here is an example using the `ClientConfig` object:

```js
const client = new Client(new ClientConfig({
    name: "Bot",
    intents: [],
    presences: {
        cycles: [],
        DEFAULT_CYCLE: "{name} | /help",
        DEFAULT_DURATION: 10,
        DEFAULT_TYPE: 'STREAMING',
        DEFAULT_URL: 'https://www.twitch.tv/cannicide'
    },
    port: process.env.PORT || 3000,
    authors: [],
    description: null,
    expansions: [],
    database: null,
    debug: {
        logs: false,
        uncaughtErrors: false,
        simulation: false
    }
}));
```

The config values shown in the above example are the default values. If you do not specify one of those config properties, the default value will be used. The above example is, therefore, the same as the below example, since the above example represents all of the defaults:

```js
const client = new Client(new ClientConfig());
```

Note that neither of the above two client construction examples will work for you with zero modifications, because intents *need* to be specified in discord.js v13 in order to successfully initialize the bot client. There are many available options for specifying intents. You can specify strings, such as `"GUILD_MESSAGES"`; you can specify the integer values of the intents; you can use the node-elisif `Intent` class (examples: `new Intent("GUILD_MESSAGES")`, `Intent.UNPRIVILEGED`, `Intent.ALL`); or you can use discord.js' `Intents` class. In the below example, we will simply use `Intent.UNPRIVILEGED` to enable all intents except the privileged intents (which require extra configuration in the discord application portal), as the easiest way to get a working example up and running. We will also use the builder function to setup the config, as an example of another way to setup the client:

```js
const client = new Client(config => config.intents(Intent.UNPRIVILEGED));
```

Try to refrain from using `Intent.UNPRIVILEGED` in production-ready code. Though it may be simple to use for testing, once your bot is fully coded and released, you'll want to properly let the Discord API know what data you will and won't need. No need to waste Discord's resources by enabling all unprivileged intents, if you do not need all of them.

With the above example, your bot code should be up and running! That is the minimal necessary code needed to get a bot up and running. While developing your bot, I would also recommend enabling node-elisif's debug mode. It was designed to help me debug issues in node-elisif while developing it, but it may serve useful to you as well. Here's an example of how it works:

```js
const client = new Client(config => config.intents(Intent.UNPRIVILEGED).debug());

client.on("ready", () => {
    client.debug("Test debug message"); // => Only logs to console if debug mode is enabled
});
```

Enabling debug mode will enable the functionality of `client.debug()`, which logs messages to the console (like `console.log`) only when debug mode is enabled. When debug mode is enabled, your debug messages will be logged to the console, along with my debug messages within node-elisif's code. When debug mode is disabled, your debug messages will be ignored, allowing you to easily switch from debugging to production-ready code without needing to delete a single debug message -- and allowing you to always keep debugging code ready if an issue ever pops up again in the future.

That is all that will be described in this Usage section for now. You will need to figure out the rest of the functionality of this package on your own until proper documentation is completed. Feel free to view the [test code](https://github.com/Cannicide/node-elisif/blob/full-rewrite/test/tests.js) as a sort of pseudo-example of how to do various things such as creating the client, building commands, using modals/components, etc.

## Credits
**Created by Cannicide#2753**

Dependencies:
```json
{
    "@discordjs/builders": "^0.13.0",
    "discord-api-types": "^0.31.1",
    "discord.js": "^13.6.0",
    "express": "^4.17.3",
    "ms": "^2.1.3",
    "sifbase": "^1.0.0"
}
```