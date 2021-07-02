var Command = require("../command");
const VCActivity = require("../vc_activities");

module.exports = new Command("vcactivity", {
  desc: "Start or join interactive activities in your voice channel!",
  aliases: ["vca"]
}, async (message) => {
  
  if (!message.member.voice.channel) return message.channel.embed({desc: `**You must be in a voice channel to use VCA!**`});


  var m = await message.channel.selectMenu({
    desc: "Start or join interactive **Voice Channel Activities (VCA)** to engage in fun activities with your VC amigos, right within your voice channel! Play games or watch youtube together in your voice channel, in real-time, without leaving Discord.\n\n*Note: This Discord feature is currently in very early beta, so some activities may be buggy or not work properly. Youtube works the most consistently.*",
    footer: [message.author.username, "Cannicide's VC Activity System"],
    title: `VCA System`
  }, {
    placeholder: "Select an activity...",
    min: 1,
    max: 1,
    options: [
        {
            label: "Youtube",
            description: "Watch videos in real-time with your VC members.",
            value: "youtube",
            emoji: message.getGlobalSetting("vca.emotes.youtube")
        },
        {
            label: "Poker Night",
            description: "Introduce your VC members to your poker face.",
            value: "poker",
            emoji: message.getGlobalSetting("vca.emotes.poker")
        },
        {
            label: "Betrayal.io",
            description: 'Play a "social deduction" game with VC members.',
            value: "betrayal",
            emoji: message.getGlobalSetting("vca.emotes.betrayal")
        },
        {
            label: "Fishington.io",
            description: "Fish with VC members. Just how bored are you...?",
            value: "fishing",
            emoji: message.getGlobalSetting("vca.emotes.fishing")
        },
        {
            label: "Chess",
            description: "Play chess online or with a VC member.",
            value: "chess",
            emoji: message.getGlobalSetting("vca.emotes.chess")
        }
    ]
  });

  m.startMenuCollector(async (menu) => {

    menu.noReply();
    var sel = menu.selected[0];

    var code = await new VCActivity(message, sel).code;
    var emoji = menu.getOptionByValue(sel).emoji;
    
    message.channel.embed({
        desc: `Click [here](${code}) to start or join a group *${sel}* activity in your VC!\n\nActivity: <:${emoji.name}:${emoji.id}> **[${menu.getOptionByValue(sel).label}](${code})**`,
        footer: [message.author.username, "Cannicide's VC Activity System"],
        title: `VCA Invite - ${message.member.voice.channel.name}`,
        color: "9b59b6"
    });

    m.endMenuCollector();

    m.delete({timeout: 2000});

  });
  
});