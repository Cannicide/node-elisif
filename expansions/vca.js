// @ts-check
// A command to start or join Voice Channel Activities.

const { Command, util } = require("../index");

const applications = {
    'youtube': '755600276941176913',
    'poker': '755827207812677713',
    'betrayal': '773336526917861400',
    'fishing': '814288819477020702',
    'chess': '832012586023256104',
    'youtube2': '880218394199220334',
    'doodlecrew': '878067389634314250',
    'lettertile': '879863686565621790',
    'wordsnack': '879863976006127627'
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
      
        // var voiceChannelId = this.message.member.voice.channelId;
        var code = undefined;
      
        if (option && option.toLowerCase() in this.applications) {
            code = await this.message.member.voice.channel.createInvite({
                targetApplication: this.applications[option.toLowerCase()],
                targetType: 2
            });
          
            return code?.url ?? "none";
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
    new Command({
      expansion: true,
      //@ts-ignore
      name: "vcactivity",
      desc: "Start or join interactive activities in your voice channel!",
      aliases: ["vca"],
      async execute(message) {
      
        if (!message.member.voice.channel) return message.channel.util.embed({desc: `**You must be in a voice channel to use VCA!**`});


        var m = await message.channel.util.selectMenu({
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
                  emoji: message.client.setting("vca.emotes.youtube")
              },
              {
                  label: "Poker Night",
                  description: "Introduce your VC members to your poker face.",
                  value: "poker",
                  emoji: message.client.setting("vca.emotes.poker")
              },
              {
                  label: "Betrayal.io",
                  description: 'Play a "social deduction" game with VC members.',
                  value: "betrayal",
                  emoji: message.client.setting("vca.emotes.betrayal")
              },
              {
                  label: "Fishington.io",
                  description: "Fish with VC members. Just how bored are you...?",
                  value: "fishing",
                  emoji: message.client.setting("vca.emotes.fishing")
              },
              {
                  label: "Chess",
                  description: "Play chess online or with a VC member.",
                  value: "chess",
                  emoji: message.client.setting("vca.emotes.chess")
              },
              {
                label: "Youtube 2.0",
                description: "An all-new Youtube interface!",
                value: "youtube2",
                emoji: message.client.setting("vca.emotes.youtube")
              },
              {
                label: "Letter Tile",
                description: "Craft words from sets of tiles!",
                value: "lettertile",
                emoji: "🔡"
              },
              {
                label: "Word Snack",
                description: "Whip up letter combos in this game for intellectuals!",
                value: "wordsnack",
                emoji: "🥞"
              },
              {
                label: "Doodle Crew",
                description: "Battle it out in this competitive doodling game!",
                value: "doodlecrew",
                emoji: "✏️"
              }
          ]
        });

        m.startMenuCollector(async (menu) => {

          menu.deferUpdate();

          menu = util.Component(menu);
          var sel = menu.selected[0];

          var code = await new VCActivity(message, sel).code;
          var emoji = menu.getOptionByValue(sel).emoji;
          
          message.channel.util.embed({
              desc: `Click [here](${code}) to start or join a group *${sel}* activity in your VC!\n\nActivity: ${emoji ? "<:"+emoji.name+":"+emoji.id+"> " : ""}**[${menu.getOptionByValue(sel).label}](${code})**`,
              footer: [message.author.username, "Cannicide's VC Activity System"],
              title: `VCA Invite - ${message.member.voice.channel.name}`,
              color: "9b59b6"
          });

          m.endMenuCollector();
          m.deleteTimeout(2);

        });
      
    }})
  ]
};