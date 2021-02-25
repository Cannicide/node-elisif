var DiscordSRZ = require("./discordsrz");
var srz = require("./evg").resolve("srz");
// const fetch = require("node-fetch");

function isImage(url) {
  var splitter = url.split(".");
  switch (splitter[splitter.length - 1]) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "apng":
      case "svg":
      case "webp":
        return true;
      default:
        return false;
  }
}

function setup(app, disc) {
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({ extended: true }));
    
    app.get("/", (req, res) => {
        res.send("Sup, I'm the Scav Discord Bot. I don't have a fancy website yet. Blame Cannicide, he's too lazy to make one. As soon as it's made, it'll be here.");
    });
  
  app.get("/profile/:user/:discrim", (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://cannicideapi.glitch.me");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var tag = req.params.user + "#" + req.params.discrim;
    res.send(disc.users.cache.find(m => m.tag == tag).displayAvatarURL());
  });
  
  app.get("/tag/from/:id", (req, res) => {
    if (!req.params.id) return res.send("Nope");
    var user = disc.users.cache.find(m => m.id == req.params.id);
    
    if (!user) return res.send("Nope");
    res.send(user.tag);
  });
  
  app.get(process.env.STAFFLIST_URL, async (req, res) => {
    var channel = disc.channels.cache.find(c => c.id == "780526546846875748");
    if (!channel) return res.send("Nope; channel not found.");
    
    var msg = await channel.messages.fetch("789697685975203851");
    if (!msg) return res.send("Nope; message not found.");
    
    res.send(msg.content);
  })

  app.get("/userstats/json", (req, res) => {
    res.send(srz.values());
  });

  app.get("/userstats/", (req, res) => {
    res.sendFile(__dirname + "/views/userstats.html");
  });
  
  /*app.get(process.env.EVIDENCE_URL, (req, res) => {
    res.sendFile(__dirname + "/views/evidence.html");
  });*/
  
  app.get(process.env.SPP_URL, (req, res) => {
    res.sendFile(__dirname + "/views/punishments.html");
  });
  
  /*app.get(process.env.EVIDENCE_URL + "/googledrive", async (req, res) => {
    
    fetch("https://www.googleapis.com/drive/v3/files?q=%27" + process.env.EVIDENCE_GD + "%27+in+parents&key=" + process.env.GD_KEY)
    .then(res => res.json())
    .then(body => {
      res.send(body);
    })
    .catch(err => res.status(503).send(err));
    
  });
  
  app.get(process.env.EVIDENCE_URL + "/googledrive/fetchurl", (req, res) => {
    
    res.send(`https://drive.google.com/drive/folders/${process.env.EVIDENCE_GD}?usp=sharing`);
    
  });*/

  //Evidence temporarily disabled due to removal of file uploading
  
  app.get(process.env.EVIDENCE_URL + "/postevidence/:channelID/:name/:url", async (req, res) => {
    
    if (!req.params.url || !req.params.name) return res.status(500).send("No URL/name was specified.");
    
    var isdirect = decodeURIComponent(req.params.url).match("\\|\\|");
    
    var url = decodeURIComponent(req.params.url).replace("||", ".");
    var name = decodeURIComponent(req.params.name);
    var channel = disc.channels.cache.get(req.params.channelID);
    
    if (!channel) return res.status(500).send("Channel was not found");
    
    channel.send({
      embed: {
        "color": 16750336,
        "description": `**Rule Violation Evidence**\n\nA file from the [ScavengerCraft Evidence Panel](https://scav-bot.glitch.me${process.env.EVIDENCE_URL}) was beamed down to this channel.`,
        "image": isdirect && isImage(url) ? {url:url} : {},
        "fields": [{"name":"File Link",value:`[🔗](${url})`}],
        "footer": {
          "icon_url": channel.guild.iconURL({dynamic:true}),
          "text": `${name} • ${isdirect ? "Direct Upload" : "Google Drive Upload"}`
        }
      }
    });
    
    res.send("Successfully beamed down: " + url);
    
  });
  
  app.use(bodyParser.json());
  
  app.post("/discordsrz", (req, res) => {
    console.log("DiscordSRZ:", req.body);
    new DiscordSRZ.DiscordSRZ.DataHandler(req.body);
  });

}

module.exports = {
    setup: setup
}