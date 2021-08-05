# Threads

Node-elisif has partial support for threads. This includes creating threads, adding/removing members, editing threads, and deleting threads. However, this package has **NO** support for thread events, including message events inside threads. Node-elisif is built with discord.js 12.5.3, which uses Discord API v8. Thread events are only supported in Discord API v9; this will be added in discord.js 13.x.x.

This example page, however, is under construction. The following is an example of how to use threads taken directly from the code of my testing bot. I have not added any explanations or descriptions to the code for now, but it should be mostly self-explanatory. Note that this example is made in Node 14.x, and makes use of the optional chaining operator. It may not work in older versions of Node unless you remove the optional chaining operator (the `?.` in `obj?.property`).

```js
const Handler = require("elisif");

module.exports = new Handler.Command("threads", {
  desc: "Testing threads",
  aliases: ["thread"],
  args: [{name: "action", feedback: "Must be one of: list, get, add, delete, archive, unarchive"}, {name:"thread_id", optional: true}]
}, async (message) => {
  
  if (message.hasArg(0, "list")) {
    
    //Active
    if (message.hasArg(1, "active")) {
      message.channel.send(`Active threads: ${(await message.channel.threads.fetchActive()).threads.map(thread => thread.name)}`);
    }
    //Archived
    else if (message.hasArg(1, "archived")) {
      message.channel.send(`Archived threads: ${(await message.channel.threads.fetchArchived()).threads.map(thread => thread.name)}`);
    }
    
  }
  else if (message.hasArg(0, "get")) {
    
    if (!message.hasArg(1)) return message.channel.send("Please specify an ID to get.");
    
    var thread = await message.channel.threads.fetch(message.getArg(1));
    return message.channel.send(`Thread name: ${thread?.name}`);
    
  }
  else if (message.hasArg(0, "add")) {
    
    if (!message.hasArg(1)) return message.channel.send("Please specify a name for the thread.");
    
    var thread = await message.channel.threads.create({
      name: message.getArg(1),
      startMessage: message.id,
      reason: "Dynamically created thread"
    });
    message.channel.send(`Created thread with name: ${thread?.name}. Members: ${(await thread?.members.fetch()).map(tmem => tmem.user.tag)}`);
    
  }
  else if (message.hasArg(0, "delete")) {
    
    if (!message.hasArg(1)) return message.channel.send("Please specify the ID of the thread.");
    
    var thread = await message.channel.threads.delete(message.getArg(1), {
      reason: "Dynamically deleted thread"
    });
    message.channel.send(`Deleted thread with name: ${thread?.name}.`);
    
  }
  else if (message.hasArg(0, "archive")) {
    
    if (!message.hasArg(1)) return message.channel.send("Please specify the ID of the thread.");
    
    var thread = await message.channel.threads.archive(message.getArg(1), {
      reason: "Dynamically archived thread"
    });
    message.channel.send(`Archived thread with name: ${thread?.name}.`);
    
  }
  else if (message.hasArg(0, "unarchive")) {
    
    if (!message.hasArg(1)) return message.channel.send("Please specify the ID of the thread.");
    
    var thread = await message.channel.threads.unarchive(message.getArg(1), {
      reason: "Dynamically unarchived thread"
    });
    message.channel.send(`Unarchived thread with name: ${thread?.name}.`);
    
  }
  
});
```