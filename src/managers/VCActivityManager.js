const CacheManager = require('./CacheManager');

module.exports = class VCActivityManager extends CacheManager {

    /** @type {import('../structures/VoiceChannel')} */
    #c;
    constructor(voiceChannel) {
        super(Object.keys(VCActivityManager.ACTIVITIES).map(name => [name, VCActivityManager.ACTIVITIES[name]]));
        this.#c = voiceChannel;
    }

    /**
     * All VCAs known by Node-Elisif, with their names mapped to their application IDs.
     */
    static ACTIVITIES = {
        "WATCH_TOGETHER": '880218394199220334',
        "POKER_NIGHT": '755827207812677713',
        "BETRAYAL.IO": '773336526917861400',
        "FISHINGTON.IO": '814288819477020702',
        "CHESS_IN_THE_PARK": '832012774040141894',
        "LETTER_LEAGUE": '879863686565621790',
        "WORD_SNACKS": '879863976006127627',
        "DOODLE_CREW": '878067389634314250',
        "AWKWORD": '879863881349087252',
        "SPELL_CAST": '852509694341283871',
        "CHECKERS_IN_THE_PARK": '832013003968348200',
        "PUTT_PARTY": '763133495793942528',
        "SKETCH_HEADS": '902271654783242291',
        "OCHO": '832025144389533716',
        "LAND.IO": '903769130790969345'
    };

    /**
     * Starts the specified Voice Channel Activity (VCA) and returns an Invite to the activity in the voice channel.
     * The names of known VCAs, or the IDs of any known or unknown VCAs, can be specified as activityName.
     * Note: some of the known/available VCAs may not be functional, or may be restricted to nitro-boosted guilds.
     * @param {"WATCH_TOGETHER"|"POKER_NIGHT"|"BETRAYAL.IO"|"FISHINGTON.IO"|"CHESS_IN_THE_PARK"|"LETTER_LEAGUE"|"WORD_SNACKS"|"DOODLE_CREW"|"AWKWORD"|"SPELL_CAST"|"CHECKERS_IN_THE_PARK"|"PUTT_PARTY"|"SKETCH_HEADS"|"OCHO"|"LAND.IO"} activityName 
     * @param {Object} [inviteOpts]
     * @returns {Promise<import('discord.js').Invite>}
     */
    start(activityName, inviteOpts = { maxAge: 86400, maxUses: 0, temporary: false, unique: false }) {
        return this.#c.createInvite({
            ...inviteOpts,
            targetType: 2,
            targetApplication: this.get(activityName) ?? activityName
        });
    }

    /**
     * Fetches all currently active Voice Channel Activity (VCA) invites in the voice channel.
     * Note: this returns active VCA invites, which does not necessarily correspond to which activity is being played in the channel.
     * VCA invites can expire before or after the activity itself ends within the voice channel.
     * @returns {Promise<import('discord.js').Collection<String, import('discord.js').Invite>>}
     */
    async active() {
        const invites = await this.#c.fetchInvites(false);
        return invites.filter(i => i.targetType == 2 && ((i.voiceActivityName = this.findKey(id => id == i.targetApplication.id)) || true));
    }

}