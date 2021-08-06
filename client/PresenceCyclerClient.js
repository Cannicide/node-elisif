
/**
 * A randomized presence message.
 * @returns {Presence}
 */
class Presence {

    #options;
    #selected;
    static index = 0;
  
    /**
     * 
     * @param {String[]} presences - A list of presences to cycle through.
     */
    constructor(presences) {
  
      this.#options = presences;
      this.#selected = this.#options[Presence.index];
      Presence.index += 1;
      if (Presence.index == this.#options.length)
        Presence.index = 0;
  
    }
  
    get() { return this.#selected; }
}

class PresenceCycler {

    static presenceInterval;

    constructor(presenceArray, presenceDuration, client) {
        this.presenceArray = presenceArray;
        this.presenceDuration = presenceDuration;
        this.client = client;
    }

    cycle() {
        if (PresenceCycler.presenceInterval) clearInterval(PresenceCycler.presenceInterval);

        var setPresence = function() {
            var presence = new Presence(this.presenceArray);

            //Allows the status of the bot to be PURPLE (I don't stream on twitch anyways)
            this.client.user.setActivity(presence.get(), { type: 'STREAMING', url: twitch });
        }.bind(this);

      //Cycles the presence every x (or 10) minutes
      PresenceCycler.presenceInterval = setInterval(setPresence,
        (this.presenceDuration && this.presenceDuration >= 0.5 ? this.presenceDuration : 10) * 60 * 1000);
      
      setPresence("immediate action");
    }

}

module.exports = PresenceCycler;