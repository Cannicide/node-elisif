# Sample Bot

This is the main file of a **simple example Discord bot** built with node-elisif.
This example is a modified version of my testing bot's server.js code!

```js
const Handler = require("elisif");
const client = new Handler.Client({
  name: "Testing Bot",
  privilegedIntents: true,
  presences: ["^help", "TESTING BOT", "This is a test.", "REWRITING BOT CODE"],
  presenceDuration: 10,
  prefix: "^",
  autoInitialize: {
    enabled: true,
    path: __dirname + "/commands",
  },
  authors: [
      {
        username: "Cannicide",
        id: "274639466294149122"
      }
  ],
  description: "A test description",
  expansions: ["help", "eval", "vca", "games", "points"]
});

//Enable debug mode for some additional messages in console on startup
Handler.settings.Global().set("debug_mode", false);

//Print version of node-elisif
console.log("Started node-elisif v" + Handler.version);

client.login(process.env.TOKEN);
```

Command detection and input interpretation are all handled automatically without the need to manually define `client.on("message")` when `autoInitialize` is enabled. You can view the underlying code behind auto-initialization [here](https://github.com/Cannicide/node-elisif/blob/main/client/Handler.js#L379) if you want to create your own customized initializer and message handler.