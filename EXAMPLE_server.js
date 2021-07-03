/**
 * 
 *  SIMPLE EXAMPLE DISCORD BOT USING node-elisif
 *  By Cannicide
 * 
 *  This example is taken directly from the server.js code of my testing bot!
 *  Command detection and input interpretation are all handled automatically without the
 *  need to manually define `client.on("message")` when auto-initialize is enabled.
 * 
 */

// const Handler = require("elisif");
// const Interpreter = Handler.interpreter;
// const client = new Handler.Client({
//   name: "Testing Bot",
//   presences: ["^help", "COOL", "TEST", "REWRITING BOT CODE"],
//   presenceDuration: 10,
//   prefix: "^",
//   autoInitialize: {
//     enabled: true,
//     path: __dirname + "/commands",
//   },
//   authors: [
//       {
//         username: "Cannicide",
//         id: "274639466294149122"
//       }
//   ],
//   description: "A test description",
//   expansions: ["help", "eval", "vca"]
// });

// // Whether or not to show debug messages
// Handler.settings.Global().set("debug_mode", false);

// //Add your bot token
// client.login(process.env.TOKEN);