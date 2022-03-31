
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

}