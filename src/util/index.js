
const { Collection } = require('discord.js');

module.exports = {

    parseBuilder(objOrBuilder, Builder) {
        if (typeof objOrBuilder === 'function') {
            const b = new Builder();
            return objOrBuilder(b) ?? b;
        }
        return objOrBuilder;
    },

    loadToken(JSONpath) {
        const fs = require('fs');
        if (!fs.existsSync(JSONpath)) return null;
        const { token } = require(JSONpath);
        return token;
    },

    asMessageOptions(optsOrContent) {
        if (typeof optsOrContent === "string") optsOrContent = {content: optsOrContent};
        return optsOrContent ?? {};
    },

    /**
     * @callback simulateMessage
     * @param {import("../client/Client")} client - The client instance
     * @param {String|Object} opts - The content or options of the message to simulate sending
     * @param {Object} [extraOpts] - Additional settings, for how to simulate the message sending
     * @param {String} [extraOpts.userId] - The user ID of the user to simulate sending the message as
     * @param {boolean} [extraOpts.bot] - Whether the message should be marked as sent by a bot
     * @param {boolean} [extraOpts.reply] - Whether the message should be marked as a reply
     * @returns {void}
     */

    /**
     * @type {simulateMessage}
     */
    get simulateMessage() {
        return function(client, opts, {userId, bot = false, reply = false} = {}) {
            if (!client.simulated) throw new Error("Cannot simulate message; client is not simulated.");
            opts = this.asMessageOptions(opts);
            console.log(`\n>> ${reply ? "REPLIED:" : "SENT"}:`, opts.content, "\n");

            const Message = require('../structures/Message');
            return client.emit("message", Message.from(client, {
                user: userId ? {
                    id: userId,
                    bot
                } : client.user,
                ...opts
            }));
        }.bind(module.exports);
    }

}

class Emap extends Collection {
    constructor(iterable = []) {
        super(iterable);
        this.emap = true;
    }

    static matches(item, cachedItem) {
        for (const key in item) {
            if (!cachedItem.hasOwnProperty(key)) return false;
            if (typeof item[key] === 'object' && item[key]) return this.matches(item[key], cachedItem[key]);
            else if (item[key] !== cachedItem[key]) return false;
        }
        return true;
    }

    get(idOrObject) {
        if (typeof idOrObject === 'string') {
            //ID
            return super.get(idOrObject);
        }
        else {
            //Object
            return super.find(o => Emap.matches(idOrObject, o));
        }
    }
}

class Estack {

    #stack;
    constructor() {
        this.#stack = [];
    }

    push(...items) {
        for (const item of items) {
            this.#stack.push(item);
        }
    }

    pop() {
        return this.#stack.pop();
    }

    peek() {
        return this.#stack[this.stack.length - 1];
    }

    asArray() {
        return this.#stack;
    }

    get length() {
        return this.#stack.length;
    }

    get empty() {
        return this.#stack.length === 0;
    }

    *[Symbol.iterator]() {
        for (const val of [...this.asArray()].reverse()) yield val;
    }

}

class Equeue {

    #queue;
    constructor() {
        this.#queue = [];
    }

    enqueue(...items) {
        for (const item of items) {
            this.#queue.push(item);
        }
    }

    pop() {
        const value = this.peek();
        this.#queue = this.#queue.slice(1); // Better performance than Array#shift()
        return value;
    }

    peek() {
        return this.#queue[0];
    }

    asArray() {
        return this.#queue;
    }

    get length() {
        return this.#queue.length;
    }

    get empty() {
        return this.#queue.length === 0;
    }

    *[Symbol.iterator]() {
        for (const val of this.asArray()) yield val;
    }

}

class Edist extends Emap {

    constructor(iterable = []) {
        super(iterable);
        this.edist = true;

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (!(prop in target)) return target.get(prop);

                const getter = Reflect.get(target, prop, receiver);
                if (typeof getter === 'function') return getter.bind(target);
                return getter;
            },
            set(target, prop, value, receiver) {
                if (!(prop in target)) return target.set(prop, value);

                const setter = Reflect.set(target, prop, value, receiver);
                if (typeof setter === 'function') return setter.bind(target);
                return setter;
            }
        });
    }

    set(key, value) {
        if (typeof key !== 'number') {
            super.set(key, value);
            this.add(value);
        }
        else super.set(Number(key), value);

        return this;
    }

    add(value) {
        super.set(this.size - 1, value);
        return this;
    }

    toArray() {
        return [...this.filter((_, k) => typeof k === 'number').sort((_, __, a, b) => a - b).values()];
    }

    toString() {
        return `Edist { [${this.toArray().join(", ")}] }`;
    }

    *[Symbol.iterator]() {
        for (const val of this.toArray()) yield val;
    }

    get [Symbol.toStringTag]() {
        return this.toString();
    }

    [Symbol.toPrimitive](hint) {
        if (hint === 'number') return this.size;
        if (hint === 'boolean') return this.size != 0;
        return this.toString();
    }

};

// TODO: TEST BELOW STRUCTURES, MAKE SEPARATE CLASS FOR THEM
module.exports.Emap = Emap;
module.exports.Estack = Estack;
module.exports.Equeue = Equeue;
module.exports.Edist = Edist;