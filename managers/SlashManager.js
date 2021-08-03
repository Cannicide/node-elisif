// Manages Slash Command Interactions

const { DiscordInteractions } = require("slash-commands");
class SlashManager {
  
  constructor(locale, client, token, public_key) {
    this.token = token;
    this.public_key = public_key;
    this.client = client;
    this.locale = locale;
  }
  
  async getSlashClient() {
    return new DiscordInteractions({
      applicationId: (await this.client.fetchApplication()).id,
      authToken: this.token ?? (this.client.token ?? process.env.TOKEN),
      publicKey: this.public_key ?? process.env.PUBLIC_KEY,
    });
  }
  
  get slash() {
    return this.getSlashClient();
  }
  
  list() {
    return this.slash.then(slash => this.locale ? slash.getApplicationCommands(this.locale) : slash.getApplicationCommands());
  }
  
  mapArgs(top) {
    return top.type == 2 || top.type == 1 ? top.options.map(group => {
      if (top.type == 2 && !("args" in group || "options" in group)) return {name: group.name}; //Subcommandgroup must have subcommands

      this.translateArg(group);

      //Do translation for all subcommands of this subcommandgroup
      //or for all arguments and choices of this subcommand
      if ("options" in group && group.options) group.options = this.mapArgs(group);

      return group;

    }) : top.options;
  }
  
  static intFromType(type) {
    var top = {type};

    if (!isNaN(top.type)) return top.type;

    if (!top.type || top.type.toLowerCase().startsWith("str")) top.type = 3; //string by default
    else if (top.type.toLowerCase() == "sub") top.type = 1;
    else if (top.type.toLowerCase() == "group") top.type = 2;
    else if (top.type.toLowerCase().startsWith("int")) top.type = 4;
    else if (top.type.toLowerCase().startsWith("bool")) top.type = 5;
    else if (top.type.toLowerCase() == "user") top.type = 6;
    else if (top.type.toLowerCase() == "channel") top.type = 7;
    else if (top.type.toLowerCase() == "role") top.type = 8;
    else if (top.type.toLowerCase() == "mention") top.type = 9;
    else if (top.type.toLowerCase() == "float") top.type = 10;
    
    return top.type;
  }
  
  static typeFromInt(num) {
    //Organize types by index:
    var types = [
      "unknown",
      "sub",
      "group",
      "string",
      "integer",
      "boolean",
      "user",
      "channel",
      "role",
      "mention",
      "float"
    ];
    
    return num < types.length ? types[num] : "unknown";
  }
  
  translateArg(top) {
    top.type = SlashManager.intFromType(top.type);
    
    if (top.optional) top.required = false;
    else top.required = true;
    
    if ([1, 2].includes(top.type)) delete top.required;
    
    if (top.desc) top.description = top.desc;
    else throw new Error("A description MUST be specified for all slash command arguments (except choices), including subcommands and subcommand groups.");
    
    if (top.args) {
      top.options = top.args;
    }
    
    if (top.options) {
      top.choices = top.options.filter(arg => "value" in arg);
      top.options = top.options.filter(arg => !("value" in arg));
    }
    
    return top;
  }
  
  static decipherArg(top, main) {
    top.type = SlashManager.typeFromInt(top.type);
    
    if (["sub", "group"].includes(top.type)) main.args_classic.push(top.name);
    else main.args_classic.push(top.value);
    
    if (["sub", "group"].includes(top.type)) main.args_object[top.name] = top.name;
    else main.args_object[top.name] = top.value;
    
    if (top.options) {
      top.args = top.options;
      
      const mapArgs = group => {
        
        //Resolve object values for users, channels, and roles based on the given ID
        if (group.type == 6) {
          //User
          let id = group.value;
          group.value = main.resolved.users?.[id];
          group.value.asMember = () => main.resolved.members?.[id];
        }
        else if (group.type == 7) {
          //Channel
          let id = group.value;
          group.value = main.resolved.channels?.[id];
        }
        else if (group.type == 8) {
          //Role
          let id = group.value;
          group.value = main.resolved.roles?.[id];
        }
        
        //Add argument values to classic and object forms of args
        if (["1", "2"].includes(group.type)) main.args_classic.push(group.name);
        else main.args_classic.push(group.value);
        
        if (["1", "2"].includes(group.type)) main.args_object[group.name] = group.name;
        else main.args_object[group.name] = group.value;
        
        //Convert argument type from integer to human-readable string
        group.type = SlashManager.typeFromInt(group.type);
        
        //Recursively continue mapping process if this argument is a subcommand or subcommandgroup
        if (group.options) group.args = group.options = group.options.map(mapArgs);
        
        //Return this argument once all subarguments (if any) have been mapped
        return group;
        
      };
      
      top.options = top.args = top.args.map(mapArgs);
      
    }
    
    return top;
  }
  
  generate({name, desc, args}) {
    let description = desc;
    args = args.map(top => {
      this.translateArg(top);
      
      //Do translation for all arguments, choices, subcommands, and subcommandgroups
      if ("options" in top && top.options) top.options = this.mapArgs(top);
      
      return top;
    });
    
    const command = {
      name: name,
      description: description,
      options: args,
    };
    
    return command;
    
  }
  
  static generateFromInteraction(interaction) {
    interaction.args = interaction.options = interaction.options.map((top) => SlashManager.decipherArg(top, interaction));
    return interaction;
  }
  
  async add({name, desc, args}) {
    let slash = await this.slash;
    let command = this.generate({name, desc, args});
    
    if (this.locale) {
      return await slash
      .createApplicationCommand(command, this.locale);
    }
    else {
      return await slash
      .createApplicationCommand(command);
    }
  }
  
  async edit({id}, {name, desc, args}) {
    let slash = await this.slash;
    let command = this.generate({name, desc, args});
    
    return await slash
    .createApplicationCommand(command, this.locale, id);
  }
  
  async delete({id}) {
    let slash = await this.slash;
    return await slash
    .deleteApplicationCommand(id, this.locale);
  }
  
}

module.exports = SlashManager;