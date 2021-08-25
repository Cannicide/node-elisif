// A built-in help command to view information and usage of all existent, visible bot commands.

const { ExpansionCommand: Command, util } = require("../index");

function helpCommand(client, message, useReactions) {

  var cmds, thumb;
    var args = util.Message(message).args;
    var prefix = util.Message(message).prefix;

    if (message.guild) {
      cmds = client.commands.all().filter(cmd => cmd.guilds.length == 0 || cmd.guilds.includes(message.guild.id) || cmd.guilds.includes(message.guild.name)).sort((a,b) => a.name.localeCompare(b.name));
      thumb = message.guild.iconURL({dynamic: true});
    }
    else {
      cmds = client.commands.all().sort((a,b) => a.name.localeCompare(b.name));
      thumb = client.user.displayAvatarURL({dynamic: true});
    }

    function getCommandUsage(item) {
      var res = {
        name: "",
        value: ""
      };

      res.name = item.name.charAt(0).toUpperCase() + item.name.substring(1) + " Command";
      res.value = (item.desc ? item.desc + "\n" : "") + "```fix\n" + prefix + item.name;// + "\n";

      let params = item.args;
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
      if (!util.Message(message).hasFlag("-nf")) {
        fields = [
          {
            name: "Usage Area",
            value: cmd.dm_only ? "Only works in **DMs**." : (cmd.guild_only ? "Only works in **guilds**." : "Works in both **DMs and guilds**."),
            inline: true
          },
          {
            name: "Cooldown",
            value: cmd.cooldown ? cmd.cooldown + " seconds" : "None",
            inline: true
          },
          {
            name: "Whitelist",
            value: "**Channels:** " + (cmd.channels.length > 0 ? cmd.channels.join(", ") : "ALL") + "\n**Guilds:** " + (cmd.guilds.length > 0 ? cmd.guilds.join(", ") : "ALL"),
            inline: true
          },
          {
            name: "Aliases",
            value: cmd.is_alias ? "Alias of " + cmd.options.aliases.join(", ") : (cmd.options.aliases.length > 0 ? cmd.options.aliases.join(", ") : "No aliases"),
            inline: true
          },
          {
            name: "Special Properties",
            value: "**Visible in Help:** " + (cmd.invisible ? "No" : "Yes") + "\n" + (cmd.flags ? "**Flags:** " + cmd.flags.map(flag => `${flag.name} (${flag.desc})`).join(", ") : ""),
            inline: true
          },
          {
            name: "Use Requirements",
            value: cmd.perms.length > 0 || cmd.roles.length > 0 ? ((cmd.perms.length > 0 ? "**Perms:** " + cmd.perms.join(", ") + "\n" : "") + (cmd.roles.length > 0 ? "**Roles:** " + cmd.roles.join(", ") : "")) : "None",
            inline: true
          }
        ];
      }

      if (cmd.devs_only && fields) fields.find(field => field.name == "Use Requirements").value = "**Users:** " + (client.authorNames().length > 0 ? client.authorNames().join(", ") : "Bot Developers");

      util.Channel(message.channel, message).embed({
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
        if (!item.invisible && !item.is_alias) {
            var res = getCommandUsage(item);
            pages.push(res);
        }
      });

      message.util.Channel().paginate({
        title: "**Commands**",
        desc: client.description ?? "Now viewing the commands for this discord bot.",
        fields: pages.slice(0, 2),
        thumbnail: thumb
      }, pages, 2, 1, useReactions);

    }

}

function helpOptions(name, client, settings) {

  return {
    expansion: true,
    name: name,
    guild_only: false,
    desc: settings?.desc ?? "Gets a list of all commands, parameters, and their descriptions.\nFormat: [optional] parameters, <required> parameters, optional (flag) parameters.",
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
    aliases: ["bothelp", client.name ? client.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "elisifhelp"],
    execute(message) {
      helpCommand(client, message, settings.useReactions);
    }
  };
}

module.exports = {
  commands: [
    new Command("help", (client, settings) => helpOptions("help", client, settings))
  ]
};