// Manages Slash Commands

class SlashManager {
  
  constructor(client, locale) {
    // this.token = token;
    // this.public_key = public_key;
    this.client = client;
    this.locale = locale;
  }
  
  async getSlashClient() {
    return this.client.application?.fetch();
  }

  async getSlashGuildClient() {
    return this.client.guilds.fetch(this.locale);
  }
  
  get slash() {
    return this.locale ?
      this.getSlashGuildClient()?.then(slash => slash?.commands) :
        this.getSlashClient()?.then(slash => slash?.commands);
  }
  
  async list() {
    return [...(await this.slash).cache.values()];
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

  static intFromEnum(en) {
    var types = [
      "unknown",
      "SUB_COMMAND",
      "SUB_COMMAND_GROUP",
      "STRING",
      "INTEGER",
      "BOOLEAN",
      "USER",
      "CHANNEL",
      "ROLE",
      "MENTIONABLE",
      "NUMBER"
    ];

    return isNaN(en) ? types.findIndex(enu => enu == en) : en;
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
  
  static decipherArg(group, main) {
    //Resolve object values for users, channels, and roles based on the given ID
    if (SlashManager.intFromEnum(group.type) == 6) {
      //User
      let id = group.value;
      group.value = main.resolved.users?.get(id);
      group.value.asMember = () => main.resolved.members?.get(id);
    }
    else if (SlashManager.intFromEnum(group.type) == 7) {
      //Channel
      let id = group.value;
      group.value = main.resolved.channels?.get(id);
    }
    else if (group.type == 8) {
      //Role
      let id = group.value;
      group.value = main.resolved.roles?.get(id);
    }

    //Add argument values to classic and object forms of args
    if ([1, 2].includes(SlashManager.intFromEnum(group.type))) main.args_classic.push(group.name);
    else main.args_classic.push(group.value);

    if ([1, 2].includes(SlashManager.intFromEnum(group.type))) main.args_object[group.name] = group.name;
    else main.args_object[group.name] = group.value;

    //Convert argument type from integer to human-readable string
    group.type = SlashManager.typeFromInt(SlashManager.intFromEnum(group.type));

    //Recursively continue mapping process if this argument is a subcommand or subcommandgroup
    if (group.options) group.args = group.options = group.options.map(top => SlashManager.decipherArg(top, main));

    //Return this argument once all subarguments (if any) have been mapped
    return group;
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
    
    return await slash.create(command);
  }

  async setAll(commands) {
    var slashData = commands.map(command => this.generate(command));
    let slash = await this.slash;

    return await slash.set(slashData);
  }
  
  async edit({id}, {name, desc, args}) {
    let slash = await this.slash;
    let command = this.generate({name, desc, args});
    
    return await slash
    .edit(id, command);
  }
  
  async delete({id}) {
    let slash = await this.slash;
    return await slash
    .delete(id);
  }

  /**
   * Bulk deletes all slash commands in this guild that match the specified array of command names.
   */
  async bulkDelete(names) {

    if (!this.locale) throw new Error('Cannot bulk delete global slash commands; only guild slash commands can be bulk deleted.');

    let list = await this.list();
    let ids = list.filter(cmd => cmd.name && names.includes(cmd.name)).map(command => command.id);
    return await Promise.all(ids.map(id => this.delete({id})));

  }

  /**
   * Bulk deletes all slash commands in this guild exccept those that match the specified array of command names.
   */
  async deleteAllExcept(names) {

    let list = await this.list();
    let newNames = list.map(cmd => cmd.name).filter(name => !names.includes(name));
    return await this.bulkDelete(newNames);

  }
  
}

module.exports = SlashManager;