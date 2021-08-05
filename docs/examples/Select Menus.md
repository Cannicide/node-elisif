# Select Menus / Dropdowns

Node-elisif supports select menus. This example page, however, is under construction. You may need to view the source code of this package and of expansions to learn how to use select menus, for now.

Here is a raw example of how to use select menus, taken directly from the code of my testing bot.

```js
const Handler = require("elisif");

module.exports = new Handler.Command("select", {
  desc: "Testing the new Elisif select menus",
  aliases: ["sel"]
}, async (message) => {
  
  //Test implementation of a roulette game using select menus
  var m = await message.channel.selectMenu({
    desc: "Embed content"
  }, [
    {
      placeholder: "Click me",
      min: 1,
      max: 1,
      options: [
        {
          label: "Bet Red",
          description: "~1 in 3 chance of winning x2 money",
          value: "red"
          // emoji: "757632465455153284" //This emote is from my private guild and will not work for you
        },
        {
          label: "Bet Green",
          description: "~1 in 20 chance of winning x20 money",
          value: "green"
          // emoji: "757632465514004601" //This emote is from my private guild and will not work for you
        },
        {
          label: "Bet Black",
          description: "~1 in 3 chance of winning x2 money",
          value: "black"
          // emoji: "757632465543102524" //This emote is from my private guild and will not work for you
        }
      ]
    }
  ]);
  
  m.startMenuCollector(async (menu) => {
    
    //Reply with embed instead of plain message by adding embed as third parameter
    menu.reply("", false, new message.interface.Embed(message, {
      desc: "Selected: " + menu.selected
    }));
    
  });
  
});
```