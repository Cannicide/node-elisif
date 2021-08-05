# Buttons

Node-elisif supports buttons. This example page, however, is under construction. You may need to view the source code of this package and of expansions to learn how to use buttons, for now.

Here is a raw example of how to use buttons, taken directly from the code of my testing bot.

```js
const Handler = require("elisif");

module.exports = new Handler.Command("button", {
  desc: "Testing the new Elisif buttons",
  aliases: ["btn"]
}, async (message) => {
  
  var m = await message.channel.button({
    content: "Test message content",
    desc: "Test embed desc"
  }, [
    {
      color: "blue",
      label: "Button 1",
    },
    {
      color: "red",
      label: "Button 2",
    },
    {
      color: "green",
      label: "Button 3",
    },
    {
      color: "green",
      label: "Button 4",
    },
    {
      color: "green",
      label: "Button 5",
    },
    {
      color: "green",
      label: "Button 6",
    }
  ]);
  
  var num = 7;
  
  /*
    On button click:
    - "Perm disables" the clicked button (disables it AND sets its color to gray)
    - Adds a green button labeled with "Button" and a number, represented by the variable "num" (starts at "Button 7")
    - Increases the value of the "num" variable by 1
  */
  var output = m.startButtonCollector(async (btn) => {
    
    btn.noReply();
    
    m.buttons.permDisable(btn);
    m.buttons.add({
      color: "green",
      label: "Button " + num++,
    });
    
  });
  
});
```