// A command to start or join Voice Channel Activities.

const Command = require("../index").Command;
const fetch = require('node-fetch');

const applications = {
    'youtube': '755600276941176913',
    'poker': '755827207812677713',
    'betrayal': '773336526917861400',
    'fishing': '814288819477020702',
    'chess': '832012586023256104'
};

class VCActivity {
    
    constructor(message, option) {
        this.client = message.client;
        this.message = message;
        this.applications = applications;
        this.option = option;
    }

    async _createCode() {
      
        var option = this.option;
      
        if (!this.message.member.voice.channel) return false;
      
        var voiceChannelId = this.message.member.voice.channelID;
        var code = "none";
      
        if (option && option.toLowerCase() in this.applications) {
          
            var applicationID = this.applications[option.toLowerCase()];
              
            var res = await fetch(`https://discord.com/api/v8/channels/${voiceChannelId}/invites`, {
                method: 'POST',
                body: JSON.stringify({
                    max_age: 86400,
                    max_uses: 0,
                    target_application_id: applicationID,
                    target_type: 2,
                    temporary: false,
                    validate: null
                }),
                headers: {
                    'Authorization': `Bot ${this.client.token}`,
                    'Content-Type': 'application/json'
                }
            });

            var invite = await res.json();

            if (invite.error || !invite.code) {
                throw new Error('An error occurred while retrieving invite data...');
            };

            code = `https://discord.com/invite/${invite.code}`
          
            return code;
          
        }
      
        return false;
    }
  
    get code() {
      return this._createCode();
    }
}

module.exports = {
  VCActivity,
  commands: [
    new Command("vcactivity", {
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
      
    })
  ]
};