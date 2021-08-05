const { Message } = require("discord.js");
const Interaction = require("./Interaction");

class MessageComponent extends Interaction {

    constructor(client, data) {


        this.id = data.data.custom_id;
        this.type = data.data.component_type;

        this.message = data.true_message ? data.true_message : new Message(client, data.message, this.channel);
        if (data.true_message) this._data.message = data.true_message;

        if (data.token) {
            /**
             * Respond to the component interaction with no interaction response; useful if you want to customize your response instead of using interaction replies.
             */
             this.noReply = async () => {
                if (this.clickEnded) throw new Error('This component interaction was already ended; cannot reply again.');
                await this.client.api.interactions(this._data.discordID, this._data.token).callback.post({
                    data: {
                        type: 6,
                        data: {
                            flags: 1 << 6,
                        },
                    },
                });
                this.clickEnded = true;
            }
        }

    }

    get index() {
      
        var index = 0;
        var comp;
          
        this._data.message.components.forEach(row => {
  
          var newcomp = row.components.findIndex(c => c.custom_id && c.custom_id == this.id);
          
          if (!comp && newcomp < 0) {
            index+= row.components.length;
          }
          else if (!comp && newcomp >= 0) {
            index += newcomp;
            comp = true;
          }
  
        });
        
        return index;
        
    }

    get row() {
  
        var rowindex = this._data.message.components.findIndex(row => {
  
          return row.components.find(c => c.custom_id && c.custom_id == this.id);
  
        });
        
        return rowindex <= -1 ? false : rowindex + 1;
        
    }
    
    //Index within row, relative to the start of the row
    get rowIndex() {
    
        var row = this.row;
        
        if (!row) return false;
        
        var rowindex = this._data.message.components[row - 1].components.findIndex(c => c.custom_id && c.custom_id == this.id);
        
        return rowindex <= -1 ? false : rowindex;
    
    }

    asComponent() {
      
        var row = this.row;
        var rowIndex = this.rowIndex;
        
        if (!row || rowIndex === false) return undefined;
        
        return this._data.message.components[row - 1].components[rowIndex];
        
    }

    get user() {
      
        var user = this.client.users.resolve(this._data.member.user.id);
        user.fetch = async () => await this.client.users.fetch(this._data.member.user.id);

        return user;
        
    }
    
    get member() {
    
        var member = this.guild ? this.guild.members.resolve(this._data.member.user.id) : undefined;
        if (member) member.fetch = async () => await this.guild.members.fetch(this._data.member.user.id);

        return member;
    
    }

}

module.exports = MessageComponent;