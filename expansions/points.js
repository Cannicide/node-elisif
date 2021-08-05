// An expansion implementing a configurable Points System to allow guild members to gain rewards for doing certain actions.

const db = require("../index").evg.remodel("points");
const Settings = require("../index").settings;
const fs = require("fs");

const client = require("../index").getClient();
const Command = require("../index").Command;



// ------ POINTS CONFIG ------ \\



class PointsConfig {

  config;
  static default_config = {
    leveling: {
      //On message
      "message": {
        points: 1, //points rewarded per trigger
        dailyCap: 500, //max triggers rewarded for user per day
        weeklyCap: false, //max triggers rewarded for user per week
        allCap: false, //max triggers rewarded for user total
        type: "message" //whether MP, AP, VP, BP, or PP
        /*
          Types:
            Message Points (MP), Action Points (AP),
            Voice Points (VP), Bonus Points (BP),
            Penalty Points (PP)
        */
      },
      //On /daily command
      "daily_command": {
        points: 5,
        dailyCap: 1,
        type: "message"
      },
      //On being in voice channel for an hour
      "voice_channel": {
        points: 10,
        dailyCap: 1,
        type: "voice"
      },
      //On server boosted
      "nitro_boost": {
        points: 100,
        weeklyCap: 4,
        type: "action"
      },
      //Free weekly bonus points during special events
      "weekly_bonus": {
        points: 75,
        weeklyCap: 1,
        type: "bonus"
      },
      //Purchasable daily point bonus for user (not stackable)
      "daily_boost": {
        points: 10,
        dailyCap: "{amount}",
        shopItem: "Daily Points Boost",
        type: "bonus"
      },
      //On member join (+) points
      "member_join": {
        points: 2,
        dailyCap: 10,
        type: "bonus"
      },
      //On member leave (-) points
      "member_leave": {
        points: -2,
        dailyCap: 10,
        type: "penalty"
      }
    },
    shop: {
      //Category
      //Discord server
      "Discord Server": {
        "Add Server Emoji": 10000,
        "Custom Discord Role": 15000,
        "Receive 'Regular Role'": {
          price: 1500,
          limit: 1
        },
        "Daily Points Boost": {
          price: 5000,
          limit: 5
        }
      },
      //Discord Nitro subscriptions
      "Nitro": {
        "Classic (1 Month)": {
          price: 25000, //Price
          noroles: ["Staff"], //Roles that cannot buy this
          limit: 1 //Max number of purchases
        },
        "Full (1 Month)": {
          price: 50000,
          noroles: ["Staff"],
          limit: 1
        }
      }
    }
  };

  static getDefaultConfig() {
    return PointsConfig.default_config;
  }

  static setDefaultConfig(locale, conf) {
    PointsConfig.default_config = conf;
    Settings.Local(locale).set("points.config", PointsConfig.getDefaultConfig());
  }

  static importConfigJSON(locale, filepath) {
    var conf = fs.readFileSync(filepath);
    PointsConfig.setDefaultConfig(locale, conf);
  }

  static leveling = class LevelingConfig {
    //All LevelingConfig methods generated automatically by Github Copilot!

    // Add obj at key trigger of PointsConfig.default_config.leveling
    static addDefault(trigger, obj) {
        PointsConfig.default_config.leveling[trigger] = obj;
    }

    static setDefault(trigger, obj) {
        LevelingConfig.addDefault(trigger, obj);
    }

    static removeDefault(trigger) {
        delete PointsConfig.default_config.leveling[trigger];
    }

  }

  static shop = class ShopConfig {
    //All ShopConfig methods generated automatically by Github Copilot!

    // Add obj at key item of key category of PointsConfig.default_config.shop
    // If category is not a key then add it to PointsConfig.default_config.shop
    static addDefault(category, item, obj) {
      if(!(category in PointsConfig.default_config.shop)) {
        PointsConfig.default_config.shop[category] = {};
      }

      PointsConfig.default_config.shop[category][item] = obj;
    }

    static setDefault(category, item, obj) {
        ShopConfig.addDefault(category, item, obj);
    }

    static removeDefaultItem(category, item) {
        delete PointsConfig.default_config.shop[category][item];
    }

    static removeDefaultCategory(category) {
        delete PointsConfig.default_config.shop[category];
    }

  }

  constructor(locale) {
    this.config = () => {
      return Settings.Local(locale).table("points.config", PointsConfig.getDefaultConfig());
    }
  }

}



// ------ POINTS SYSTEM ------ \\



class PointsSystem {

  guild;
  points;
  conf;
  client = client;

  constructor(locale) {
    this.guild = locale;
    
    this.points = db.table(locale);
    if (!this.points) this.points = db.table(locale);

    var config = new PointsConfig(locale);
    this.conf = () => config.config();
  }

  getPlayer(user) {

    if (!this.points.has(user)) {
      this.points.set(user, {
        points: 0,
        awards: {},
        purchases: []
      });
    }

    return this.points.table(user);
  }

  addPoints(user, value, type = "points") {
    if (!value) return;
    else if (value < 0) return this.removePoints(user, Math.abs(value));

    var player = this.getPlayer(user);
    player.add(type, value);
  }

  setPoints(user, value, type = "points") {
    var player = this.getPlayer(user);
    player.set(type, value);
  }

  removePoints(user, value, type = "points") {
    if (!value) return;
    else if (value < 0) return this.addPoints(user, Math.abs(value));

    //Ensure point total does not go below 0
    if (this.getPoints(user) < value) value = this.getPoints(user);

    var player = this.getPlayer(user);
    player.subtract(type, value);
  }

  getPoints(user, type = "points") {
    var player = this.getPlayer(user);
    return player.get(type);
  }

  // Reset points system and points config in this guild
  reset() {
    this.points.clear();
    this.conf().clear();

    return true;
  }

  autoAward(user, cause) {
    var leveling = this.conf().table("leveling");

    //This cause is defined in the config
    if (leveling.has(cause)) {
      var award = leveling.get(cause).points;
      var type = leveling.get(cause).type || "action";

      var dailyCap = leveling.get(cause).dailyCap;

      if (dailyCap == "{amount}" && "shopItem" in leveling.get(cause)) {
        var shop = new PointsShop(this.guild, {id: user});
        var purchase = shop.getPurchase(leveling.get(cause).shopItem);

        dailyCap = purchase.amount;
      }
      else if (dailyCap == "{amount}") dailyCap = 0;

      var weeklyCap = leveling.get(cause).weeklyCap;
      var allCap = leveling.get(cause).allCap;

      var player = this.getPlayer(user);
      var userAwards = player.table("awards");
      var passesChecks = true;

      //User has been awarded points for this cause before;
      //check if daily, weekly, or all-time limits are exceeded
      if (userAwards.has(cause)) {

        var causeTable = userAwards.table(cause);

        // Establish timing variables

        var lastAwarded = causeTable.get("timestamp");
        var now = Date.now();
        var timePassed = now - lastAwarded;
        var daysPassed = timePassed / 1000 / 60 / 60 / 24;

        // Reset time-exceeded cap limits

        if (dailyCap && dailyCap > 0 && daysPassed >= 1) causeTable.set("daily", 0);

        if (weeklyCap && weeklyCap > 0 && daysPassed / 7 >= 1) causeTable.set("weekly", 0);

        // Determine awards given in current day, week, or total

        var totalAwarded = causeTable.get("total");
        var dailyAwarded = causeTable.get("daily");
        var weeklyAwarded = causeTable.get("weekly");

        // Cap limit checks

        if (dailyCap && dailyCap > 0 && daysPassed < 1 && dailyAwarded >= dailyCap) passesChecks = false;
        else if (dailyCap === 0) passesChecks = false;

        if (weeklyCap && weeklyCap > 0 && daysPassed < 7 && weeklyAwarded >= weeklyCap) passesChecks = false;
        else if (weeklyCap === 0) passesChecks = false;

        if (allCap && allCap > 0 && totalAwarded >= allCap) passesChecks = false;
        else if (allCap === 0) passesChecks = false;

        //Update award totals if checks were passed
        if (passesChecks) {
          causeTable.add("total", 1);
          causeTable.add("daily", 1);
          causeTable.add("weekly", 1);
          causeTable.set("timestamp", now);
        }

      }
      //User has not been awarded for this cause before,
      //create a new db table for this cause.
      else {

        if (dailyCap !== 0 && weeklyCap !== 0 && allCap !== 0) passesChecks = true;
        else passesChecks = false;

        userAwards.set(cause, {
          timestamp: Date.now(),
          daily: passesChecks ? 1 : 0,
          weekly: passesChecks ? 1 : 0,
          total: passesChecks ? 1 : 0
        });

      }

      //If all checks passed, award points for this cause.
      if (passesChecks) {
        this.addPoints(user, award);
        this.addPoints(user, Math.abs(award), type);
      }

    }
    //This cause is not defined in the config
    else {
      throw new Error("The award cause '" + cause + "' is not defined in the PointsConfig.");
    }

  }

  getEvents() {
    var leveling = this.conf().table("leveling");
    var keys = leveling.all().map(item => item.key);

    return keys;
  }

}



// ------ POINTS SHOP ------ \\



class PointsShop {

  system;
  user;
  roles = [];

  static auto_rewards = {};
  static def_reward = false;

  constructor(locale, user) {

    this.system = new PointsSystem(locale);
    this.user = user.id;
    
    if (user.roles) this.roles = user.roles.cache.map(r => r.name);

  }

  get listings() {
    var shop = this.system.conf().table("shop");
    return shop;
  }

  getCategory(item) {

    var shop = this.listings;
    // return shop.all().map(item => item.key).find(key => item in shop.get(key));
    return shop.findKey(item);

  }

  getItem(item) {

    var shop = this.listings;
    var category = this.getCategory(item);

    var data = shop.table(category).get(item);

    if (typeof data === "object") return data;
    else return {price: data,noroles: false,limit: 0};

  }

  getCost(item, amount) {

    amount = amount || 1;

    var individualCost = this.getItem(item).price;

    var totalCost = Math.round(individualCost * amount);

    return totalCost;

  }

  canPurchase(item, amount) {

    amount = amount || 1;

    var cost = this.getCost(item, amount);
    var balance = this.system.getPoints(this.user);

    var itemData = this.getItem(item);
    var noroles = itemData.noroles;

    var buyLimit = itemData.limit;
    var currentAmount = this.getPurchase(item).amount;

    var exceedsLimit = false;
    var hasBlacklistedRole = false;

    if (buyLimit > 0) exceedsLimit = currentAmount + amount > buyLimit;

    if (noroles) hasBlacklistedRole = this.roles.find(v => noroles.includes(v));

    if (cost <= balance && !exceedsLimit && !hasBlacklistedRole) return {result: true};
    else if (cost > balance) return {result: false, reason: "You do not have enough points to purchase this."};
    else if (hasBlacklistedRole) return {result: false, reason: `This item cannot be purchased by users with the ${hasBlacklistedRole} role.`}
    else return {result: false, reason: `You can only purchase this item ${buyLimit} time.`};

  }

  getPurchase(item) {

    var category = this.getCategory(item);
    var entry = new RegExp(`${category} - ${item.replace(/[\(\)]/g, "\\$&")} x\\d`);

    var purchases = this.system.getPlayer(this.user).get("purchases");
    var purchase = purchases.filter(purchased => purchased.match(entry));

    purchase = purchase.map(v => {
      return Number(v.substring(v.lastIndexOf("x") + 1).split(" ")[0]);
    });

    var totalAmount = purchase.length < 1 ? 0 : purchase.reduce((aggregator = 0, v) => aggregator + v);

    return {
      item,
      amount: totalAmount
    };

  }

  purchase(item, amount) {

    amount = amount || 1;
    var cost = this.getCost(item, amount);
    var canPurchase = this.canPurchase(item, amount);

    if (!canPurchase.result) return "Purchase Error: " + canPurchase.reason;

    this.system.removePoints(this.user, cost);
    this.system.getPlayer(this.user).table("purchases").push(`${this.getCategory(item)} - ${item} x${amount}`);

    this.autoReward(item, amount);

    return "Purchase Successful!";

  }

  resolve(item, amount) {
    //Called once the user has received the reward they purchased

    var category = this.getCategory(item);
    var product = `${item} x${amount}`;
    var entry = `${category} - ${product}`;

    var purchases = this.system.getPlayer(this.user).get("purchases");
    var purchase = purchases.findIndex(purchased => purchased == entry);

    //Already resolved, or never purchased
    if (purchases.length < 1 || purchase < 0 || !purchases || !purchase) return false;

    entry += " [resolved]";

    purchases[purchase] = entry;
    this.system.getPlayer(this.user).set("purchases", purchases);

    return true;

  }

  refund(item, amount) {

    amount = amount || 1;
    var cost = this.getCost(item, amount);

    this.system.addPoints(this.user, cost);
    return true;

  }

  objectify() {

    return this.listings.objectify();

  }

  /**
   * Registers an auto reward (i.e. an item that is given to the user immediately when they purchase it, such as a Discord role).
   * @param {(item, amount) => Boolean} method - The method to automatically execute when the specified item is purchased.
   */
  registerAutoReward(item, method) {

    if (item in PointsShop.auto_rewards) return;

    PointsShop.auto_rewards[item] = method;

  }

  /**
   * Registers a default reward for items without an auto reward registered (e.g. for automatically sending a message to a staff member, who will give all non-auto rewards to the user manually, when a user makes a purchase).
   * @param {(item, amount) => Boolean} method - The method to automatically execute when an item without a registered auto reward is purchased.
   */
  registerDefaultReward(method) {

    if (PointsShop.def_reward) return;

    PointsShop.def_reward = method;

  }

  /**
   * Gives this user the reward/item they purchased if there is an auto reward registered for it, or executes a default method if one is registered, or does nothing if neither of the above are true.
   */
  autoReward(item, amount) {

    var isAuto = item in PointsShop.auto_rewards;

    if (isAuto) return PointsShop.auto_rewards[item](item, amount);

    var isDef = PointsShop.def_reward;

    if (isDef) return isDef(item, amount);

    return false;

  }

}



// ------ POINTS LEADERBOARDS ------ \\



class PointsLeaderboard {

  system;

  constructor(locale) {

    this.system = new PointsSystem(locale);

  }

  //Use discord user's ID to get their tag using the client.users.cache (Discord.Collection<User>)
  getTagFromID(id) {
    //Auto-generated by Github Copilot
    var user = this.system.client.users.cache.get(id);
    if (user) return user.tag;
    else return "-";
  }

  get players() {

    var players = this.system.points.all().map(pl => {
      var output = pl.value;
      output.id = pl.key;
      output.tag = this.getTagFromID(pl.key);

      return output;
    });

    return players;

  }

  get boards() {

    var sort = (type) => {

      return this.players.filter(user => type in user).sort((userA, userB) => userB[type] - userA[type]);

    }

    return {
      get message() {
        return sort("message");
      },

      get action() {
        return sort("action");
      },

      get voice() {
        return sort("voice");
      },

      get bonus() {
        return sort("bonus");
      },

      get penalty() {
        return sort("penalty");
      },

      get total() {
        return sort("points");
      }
    };
  }

}



// ------ NATIVE / BUILT-IN / DEFAULT POINTS COMMANDS ------ \\



class NativePointsCommands {

    static get() {

        return Object.values(NativePointsCommands);

    }

    static Points = new Command("points", {
        desc: "View how many points you and/or another user have.",
        aliases: ["rank"],
        args: [{
            name: "user",
            optional: true
        }]
    }, async message => {
        
        // TEST POINTS COMMAND
        // NOT EVEN CLOSE TO FINAL PRODUCT

        var points = new PointsSystem(message.guild.id).getPoints(message.author.id);

        if (points <= 0) message.channel.send("You have no points!");

        message.channel.send(`You have ${points} points.`);

    });


    static Shop = new Command("shop", {
        desc: "View and purchase items from the Points Shop.",
        aliases: ["pointshop", "pointsshop"],
        args: [{
            name: "disable",
            optional: true
        }]
    }, async message => {

        // TEST SHOP COMMAND
        // NOT EVEN CLOSE TO FINAL PRODUCT

        var shop = new PointsShop(message.guild.id, message.author);

        // SHOP DISABLE FUNCTIONALITY:
        // If the user passes a disable argument, disable the shop for this guild until re-enabled.

        if (message.hasArg(0, "disable")) {
            //Disable shop for this guild
            message.guild.settings.set("points.shop_disabled", true);
            message.channel.send("Disabled the Points Shop for this guild.");
            return;
        }
        else if (message.hasArg(0, "enable")) {
            //Enable shop for this guild
            message.guild.settings.set("points.shop_disabled", false);
            message.channel.send("Enabled the Points Shop for this guild.");
            return;
        }

        // SHOP DISABLED FUNCTIONALITY:
        // If the shop is disabled for this guild, return an error message.

        if (message.guild.settings.get("points.shop_disabled")) {
            message.channel.send("The Points Shop is currently disabled for this guild.");
            return;
        }

        // SHOP DISPLAY FUNCTIONALITY:
        // Display all shop categories and items in order

        var pre_render = shop.listings.all().map(listing => {

            /*
                Listings format:
                [
                    key: "Category",
                    value: {
                        "Item Name": PRICE,
                        "Another Item": {
                            price: PRICE,
                            noroles: [NONE, OF, THESE, ROLES],
                            limit: MAX PURCHASES PER USER
                        }
                    }
                ]
            */
            
            var output = `**${listing.key}**\n`;

            var items = Object.keys(listing.value).map(name => {

                var price = typeof listing.value[name] === 'number' ? listing.value[name] : listing.value[name].price;
                var item = `\t${name} - ${price} points`;

                return item;
            }).join("\n\n");
            
            output += items;
            return output;

        });

        var final_render = pre_render.join("\n");

        message.channel.embed({
            desc: final_render
        });

    });

    static Leaderboard = new Command("pointslb", {
        expansion: true,
        desc: "View the top players on the Points Leaderboard.",
        aliases: ["ranks", "pointlb", "levels", "pointslbs", "pointlbs"],
        args: [{
            name: "category", //The board type (message, action, voice, bonus, penalty, total)
            optional: true   
        }]
    }, async message => {
        
        // TEST LEADERBOARD COMMAND
        // NOT EVEN CLOSE TO FINAL PRODUCT

        const lb = new PointsLeaderboard(message.guild.id);

        var output = {
            title: "Points Leaderboard",
            desc: "*Compete for the most points!*\n",
            fields: []
        };

        /*
            BASE EMBED FORMAT FOR LB:

            {title: "Points Leaderboard", desc: "*Compete for the most points!*\n", fields: [
                {
                    name: "** **",
                    value: "> **Total Points**"
                },
                {
                    name: "Players",
                    value: "`1)` Player #1\n`2)` Player #2\n**`3)`** __**Player #3**__\n`4)` Player #4\n`5)` Player #5",
                    inline: true
                },
                {
                    name: "Points",
                    value: "`10000`\n`8000`\n__**`4500`**__\n`250`\n`10`",
                    inline: true
                },
                {
                    name: "** **",
                    value: "> **Message Points**"
                },
                {
                    name: "Players",
                    value: "`1)` Player #2\n`2)` Player #1\n`3)` Player #4\n**`4)`** __**Player #3**__\n`5)` Player #5",
                    inline: true
                },
                {
                    name: "Points",
                    value: "`600`\n`500`\n`20`\n__**`10`**__\n`3`",
                    inline: true
                }
            ]}

        */
        
        //Create the embed fields for the specified category of leaderboard, for the text leaderboard
        function render_field(type) {

            type = type.toLowerCase();
            if (type == "total") type = "points";

            //Add header field
            var header = type == "points" ? "Total" : type.slice(0, 1).toUpperCase() + type.slice(1);
            output.fields.push({
                name: "** **",
                value: `> **${header} Points**`
            });

            var board = lb.boards[type];
            var players = [];
            var points = [];

            //Ensure board is always at least 5 point user objects long
            if (board.length < 5) board.push(...new Array(5 - board.length).fill({tag: "-", points: "-"}));

            //Only use the top 5 for this board
            board = board.slice(0, 5);

            board.forEach((user, index) => {

                // Embed approach
                var suffix = user.tag == message.author.tag ? "__**" : "";
                players.push(`**\`${index + 1})\`** ${suffix}${user.tag}${suffix.split("").reverse().join("")}`);
                points.push(`${suffix}\`${user.points}\`${suffix.split("").reverse().join("")}`);

            });

            output.fields.push({
                name: "Players",
                value: players.join("\n"),
                inline: true
            });

            output.fields.push({
                name: "Points",
                value: points.join("\n"),
                inline: true
            });

            return header;

        }

        // All categories of points leaderboards
        // Intentionally excludes penalty points; don't want to encourage bad behavior
        var categories = ["message", "action", "voice", "bonus", "total"];

        // If a category is specified, only display that category
        if (message.hasArg(0)) {

            var category = message.args[0].toLowerCase();
            if (categories.indexOf(category) == -1) return message.reply(`Invalid Points Leaderboard category. Must be one of: ${categories.join(", ")}.`, {inline: true});

            categories = [category];

        }

        categories.forEach(category => render_field(category));
        return message.channel.embed(output);
        
    });

}



// ------ NATIVE / BUILT-IN / DEFAULT LEVELING HANDLERS ------ \\



class NativeLevelingHandlers {

    static initialize() {
        NativeLevelingHandlers.Message();
    }

    static message_timestamps = [];

    //Setup giving points for messages
    //and giving points for Daily Boost
    static Message() {

        client.on("message", message => {

            //Check if points system enabled in this guild
            if (!message.guild.settings.get("points.enabled")) return false;

            //No points for bots or DMs
            if (message.author.bot) return false;
            if (message.guild == null) return false;

            //Daily boost points, if applicable
            var system = new PointsSystem(message.guild.id);
            system.autoAward(message.author.id, "daily_boost");

            //No points for commands
            if (message.isCommand()) return false;

            //Ensure message points given only in configured category channels, if any
            var categories = message.guild.settings.get("points.message_categories");
            if (categories && categories.length > 0 && message.channel.parent && !categories.find(c => c.name.toLowerCase() == message.channel.parent.name.toLowerCase())) return false;

            //Ensure user meets cooldown threshold
            //Establish cooldown times
            const now = Date.now();
            const cooldownAmount = (message.guild.settings.get("points.message_cooldown") || 5 * 60) * 1000;
            const userTimestamp = NativeLevelingHandlers.message_timestamps[message.author.id] || (now - cooldownAmount);
            const expirationTime = userTimestamp + cooldownAmount;

            if (now < expirationTime) return false;

            NativeLevelingHandlers.message_timestamps[message.author.id] = now;
            setTimeout(() => delete NativeLevelingHandlers.message_timestamps[message.author.id], cooldownAmount);

            //After passing all of these requirements, give user message points
            system.autoAward(message.author.id, "message");
            return true;

        });

    }

}



// ------ EXPORT ------ \\

module.exports = {

  Config: PointsConfig,
  System: PointsSystem,
  Shop: PointsShop,
  Leaderboard: PointsLeaderboard,

  commands: NativePointsCommands.get(),

  initialize() {
    NativeLevelingHandlers.initialize();
  }

}