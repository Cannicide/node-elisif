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

module.exports = VCActivity;