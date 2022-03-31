

module.exports = class ChannelTypeManager {

    #t;
    constructor(channel) {
        this.#t = channel.type;
    }

    isText() {
        return this.#t == "GUILD_TEXT";
    }

    isThread() {
        return !!this.#t.match("THREAD");
    }

    isTextBased() {
        return ["GUILD_TEXT", "DM", "GROUP_DM", "GUILD_NEWS"].includes(this.#t) || this.isThread();
    }

    isDM() {
        // TODO: add warning if partials for dm not enabled
        return !!this.#t.match("DM");
    }

    isSingleDM() {
        return this.#t == "DM";
    }

    isGroupDM() {
        return this.#t == "GROUP_DM";
    }

    isVoice() {
        return this.#t == "GUILD_VOICE";
    }

    isVoiceBased() {
        return ["GUILD_VOICE", "GUILD_STAGE_VOICE"].includes(this.#t);
    }

    isCategory() {
        return this.#t == "GUILD_CATEGORY";
    }

    isNews() {
        return this.#t == "GUILD_NEWS";
    }

    isPublic() {
        return this.isThread() && !!this.#t.match("PUBLIC");
    }

    isPrivate() {
        return this.isThread() && !!this.#t.match("PRIVATE");
    }

    isStage() {
        return this.#t == "GUILD_STAGE_VOICE";
    }

    isUnknown() {
        return this.#t == "UNKNOWN" || !(
            this.isCategory()
            || this.isTextBased()
            || this.isVoiceBased()
            || this.isThread()
        );
    }

    [Symbol.toPrimitive]() {
        return this.#t;
    }

    get [Symbol.toStringTag]() {
        return this.#t;
    }

}