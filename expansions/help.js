var Command = require("../command");
const client = require("../index").Client.getInstance();

module.exports = new Command("help", {
  desc: "Gets a list of all commands, parameters, and their descriptions.\nFormat: [optional] parameters, <required> parameters, optional (flag) parameters.",
  args: [
    {
      name: "command",
      optional: true
    },
    {
      name: "nf",
      flag: "Displays only basic command info."
    }
  ],
  aliases: ["bothelp", client.name ? client.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "elisifhelp"]
}, (message) => {

    var cmds = new Command(false, {}).getCommands();
    var prefix = message.prefix;
    var args = message.args;
    var thumb = message.guild.iconURL({dynamic: true});

    function getCommandUsage(item) {
      var res = {
        name: "",
        value: ""
      };

      res.name = item.name.charAt(0).toUpperCase() + item.name.substring(1) + " Command";
      res.value = (item.desc ? item.desc + "\n" : "") + "```fix\n" + prefix + item.name;// + "\n";

      let params = item.cmd.getArguments();
      if (!params) {
          res.value += "```\n** **";
      }
      else {
        params.forEach((arg) => {
          if ("static" in arg && arg.static) {
            res.value += ` ${arg.name}`;
          }
          else if ("flag" in arg && arg.flag) {
            res.value += ` (-${arg.name})`;
          }
          else if ("optional" in arg && arg.optional) {
            res.value += ` [${arg.name}]`;
          }
          else {
            res.value += ` <${arg.name}>`;
          }
        });
        res.value += "```\n** **";
      }

      res.inline = true;
      return res;
    }

    if (args && cmds.find(c => c.name.toLowerCase() == args[0].toLowerCase())) {
      //Get command info for one command.

      var cmd = cmds.find(c => c.name.toLowerCase() == args[0].toLowerCase());

      var res = getCommandUsage(cmd);
      var fields = false;

      //Add more information for this single command, if flag unspecified
      if (!(message.flags && message.flags.includes("-nf"))) {
        fields = [
          {
            name: "DM-Only Command",
            value: cmd.dm_only ? "Only works in DMs." : "Does not work in DMs.",
            inline: true
          },
          {
            name: "Cooldown",
            value: cmd.cooldown ? cmd.cooldown + " seconds" : "None",
            inline: true
          },
          {
            name: "Whitelisted Channels",
            value: cmd.channels.length > 0 ? cmd.channels.join(", ") : "Command works in all channels",
            inline: true
          },
          {
            name: "Aliases",
            value: cmd.isalias ? "Alias of " + cmd.aliases.join(", ") : (cmd.aliases.length > 0 ? cmd.aliases.join(", ") : "No aliases"),
            inline: true
          },
          {
            name: "Special Properties",
            value: (cmd.special ? "**Visible in Help:** No" : "**Visible in Help:** Yes") + "\n" + (cmd.flags ? "**Flags:** " + cmd.flags.map(flag => `${flag.name} (${flag.desc})`).join(", ") : ""),
            inline: true
          },
          {
            name: "Use Requirements",
            value: cmd.perms || cmd.roles ? ((cmd.perms ? "**Perms:** " + cmd.perms.join(", ") + "\n" : "") + (cmd.roles ? "**Roles:** " + cmd.roles.join(", ") : "")) : "None",
            inline: true
          }
        ];
      }

      if (res.name == "Eval Command" && fields) fields.find(field => field.name == "Use Requirements").value = "**Users:** Bot developers only";

      message.channel.embed({
        title: res.name,
        desc: res.value,
        thumbnail: thumb,
        fields: fields
      });

    }
    else {
      //Get command info for all commands.

      var pages = [];
      cmds.forEach((item) => {
        if (!item.special && !item.isalias) {
            var res = getCommandUsage(item);
            pages.push(res);
        }
      });

      message.channel.paginate({
        title: "**Commands**",
        desc: client.description || "Now viewing the commands for this discord bot.",
        fields: pages.slice(0, 2),
        thumbnail: thumb
      }, pages, 2);

    }

});