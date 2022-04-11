
module.exports = class Timestamp {

    /** @type {Date} */
    #d;
    /** @type {Number}*/
    #t;
    constructor(date, timestamp) {
        this.#d = date;
        this.#t = timestamp;
    }

    asDate() {
        return this.#d;
    }

    asNumber() {
        return this.#t;
    }

    asUnix() {
        return Math.floor(this.#d.getTime() / 1000);
    }

    asString(style = "R") {
        return `<t:${this.asUnix()}:${style}>`;
    }

    [Symbol.toPrimitive](hint) {
        if (hint == "number") return this.asNumber();
        return this.asString();
    }

    get [Symbol.toStringTag]() {
        return this.asString();
    }

    /**
     * Constructs a new Timestamp instance from a specified amount of time relative to now (e.g. 2 minutes from now or 7 hours ago).
     * Note that the number/timestamp value of the returned Timestamp instance will be relative, unlike the usual absolute unix timestamp.
     * Depending on the datatype specified, the unit of time will differ:
     * - Number: Milliseconds.
     * - String: Any relative time, such as milliseconds, seconds, minutes, hours, days, etc. and their abbreviations.
     * - BigInt: Minutes.
     * - undefined: 0 milliseconds (the current time).
     * - other: null
     * @param {Number|String|BigInt|null} [timeResolvable] - The amount of time before/after now to construct the timestamp for.
     * @returns {Timestamp}
     */
    static fromRelativeTime(timeResolvable = undefined) {
        const ms = require("ms");
        let timestamp = 0;

        if (typeof timeResolvable === "string") timestamp = ms(timeResolvable);
        else if (typeof timeResolvable === "bigint") timestamp = Number(timeResolvable) * 60 * 1000;
        else if (typeof timeResolvable === "number") timestamp = timeResolvable;

        const date = new Date();
        if (Number.isFinite(timestamp)) date.setTime(date.getTime() + timestamp);

        return new this(date, timeResolvable !== undefined ? timestamp : null);
    }

    /**
     * Constructs a new Timestamp instance from an absolute number of milliseconds since Jan 1, 1970 GMT.
     * @param {Number} timestampMs - The number of milliseconds between Jan 1, 1970 GMT and the desired datetime.
     * @returns {Timestamp}
     */
    static fromTime(timestampMs) {
        const date = new Date();
        date.setTime(timestampMs);
        return new this(date, timestampMs);
    }

    /**
     * Constructs a new Timestamp instance from an absolute datetime.
     * This method works similarly to Timestamp#fromUnixTime().
     * It accepts an absolute datetime instead of relative times.
     * @param {Date|String} dateResolvable - The datetime to construct the timestamp from; must be parsable by the Date constructor.
     * @returns {Timestamp}
     */
    static fromDate(dateResolvable = new Date()) {
        const date = new Date(dateResolvable);
        return new this(date, date.getTime());
    }

}