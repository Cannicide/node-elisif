
const { Collection } = require('discord.js');
const Boa = require('./Boa');

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
    },

    /**
     * Creates an extended function from a function and provided extra properties.
     * @param {Function} f - The function to extend.
     * @param {ExtendedFunction} properties - An object with static properties to extend the function with.
     * @returns {ExtendedFunction} An extended function with additional specified static properties added to it.
     */
    extendedFunction(f, properties) {
        for (const prop in properties) f[prop] = properties[prop];
        return f;
    },

    /**
     * Extends a target object using all properties and prototype properties of the source object.
     * Any properties already on the target object will NOT be overrided by the source object.
     * This method will navigate the full prototype chain of the source object, applying the properties of all parent classes to the target object.
     * @param {*} target - The target object to extend.
     * @param {*} source - The object to use to extend the target object.
     */
    deepExtendInstance(target, source) {
        for (const key in source) if (!(key in target)) Object.defineProperty(target, key, { value: source[key] });

        let proto = source;
        const extendPrototype = () => {
            for (const key in Object.getOwnPropertyDescriptors(proto)) {
                const descriptor = Object.getOwnPropertyDescriptors(proto)[key];
                if (descriptor.value && typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(source);
                if (descriptor.get && typeof descriptor.get === 'function') descriptor.get = descriptor.get.bind(source);
                if (descriptor.set && typeof descriptor.set === 'function') descriptor.set = descriptor.set.bind(source);
                if (!(key in target)) Object.defineProperty(target, key, descriptor);
            }
        };

        while (Object.getPrototypeOf(proto)) extendPrototype(proto = Object.getPrototypeOf(proto));
    },

    guilds(structure, ...ids) {
        const GuildManager = require('../managers/GuildManager');
        const guilds = new GuildManager(structure.guilds);
        if (ids.flat().length) return guilds.filter(g => ids.flat().includes(g.id));
        return guilds;
    },

    channels(structure, ...ids) {
        const ChannelManager = require('../managers/ChannelManager');
        const channels = new ChannelManager(structure.channels);
        if (ids.flat().length) return channels.filter(c => ids.flat().includes(c.id));
        return channels;
    },

    /**
     * @typedef {Object} EmbedFactory
     * @property {(name, value, inline = false) => EmbedFactory} field - Adds a field to the embed
     * @property {(...fields) => EmbedFactory} fields - Adds multiple fields to the embed
     * @property {(name, url, iconURL) => EmbedFactory} author - Sets the author of the embed
     * @property {(colorResolvable) => EmbedFactory} color - Sets the color of the embed
     * @property {(desc) => EmbedFactory} description - Sets the description of the embed
     * @property {(messageContent) => EmbedFactory} content - Sets the content of the embed's message
     * @property {(text, iconURL) => EmbedFactory} footer - Sets the footer of the embed
     * @property {(urlOrBuffer, filename) => EmbedFactory} image - Sets the image of the embed
     * @property {(url) => EmbedFactory} thumbnail - Sets the thumbnail of the embed
     * @property {(timestamp = null) => EmbedFactory} timestamp - Sets the timestamp of the embed
     * @property {(title, url) => EmbedFactory} title - Sets the title of the embed
     * @property {(channel) => Promise<Message>} send - Sends the embed to the specified channel
     * @property {() => MessageEmbed} get - Returns the embed object
     * @property {() => EmbedFactory} debug - Readably stringifies and logs the embed object to console
     */

    /**
     * @param {String|MessageEmbedResolvable} [optsOrContent] - The options or message content of the embed to create
     * @returns {EmbedFactory}
     */
    embed(optsOrContent = null) {
        const MessageEmbed = require('../structures/MessageEmbed');
        const embed = (() => new MessageEmbed(module.exports.asMessageOptions(optsOrContent)))();

        return {
            field(name, value, inline = false) {
                embed.addField(name, value, inline);
                return this;
            },
            fields(...fields) {
                embed.addFields(...fields.flat());
                return this;
            },
            author(name, url, iconURL) {
                embed.setAuthor({
                    name,
                    url,
                    iconURL
                });
                return this;
            },
            color(colorResolvable) {
                embed.setColor(colorResolvable);
                return this;
            },
            description(desc) {
                embed.setDescription(desc);
                return this;
            },
            content(messageContent) {
                embed.setContent(messageContent);
                return this;
            },
            footer(text, iconURL) {
                embed.setFooter({
                    text,
                    iconURL
                });
                return this;
            },
            image(urlOrBuffer, filename) {
                embed.setImage(urlOrBuffer, filename);
                return this;
            },
            thumbnail(url) {
                embed.setThumbnail(url);
                return this;
            },
            timestamp(timestamp = null) {
                embed.setTimestamp(timestamp);
                return this;
            },
            title(title, url) {
                embed.setTitle(title, url);
                return this;
            },
            send(channel) {
                return channel?.send({ embed });
            },
            // TODO: add reply method
            get() {
                return embed;
            },
            set(optsOrContent) {
                embed.set(optsOrContent);
                return this;
            },
            debug() {
                console.log(JSON.stringify(this.get(), null, '\t'));
                return this;
            }
        }
    },

    CREATE_MESSAGE_CUSTOM_METHODS: {},

    createMessage(optsOrContent) {

        return {
            messageData: {
                ...module.exports.asMessageOptions(optsOrContent)
            },
            ...module.exports.CREATE_MESSAGE_CUSTOM_METHODS,
            embed(/** @type {EmbedResolvable|(e: EmbedFactory) => void} */ f) {
                let embedData = module.exports.embed();
                if (typeof f === 'function') embedData = f(embedData)?.get() ?? embedData.get();
                else embedData = f;
                this.messageData.embeds = [].concat(this.messageData.embeds ?? []).concat(embedData);
                return this;
            },
            // TODO: add button builder
            // TODO: add select menu builder
            send(channel) {
                return channel?.send(this.messageData);
            },
            get() {
                return this.messageData;
            }
        }
    },

    get boa() {
        return Boa();
    }

}

class Emap extends Collection {
    constructor(iterable = []) {
        super(iterable);
        this.emap = true;
    }

    static matches(item, cachedItem) {
        if (item && cachedItem && Boa().isObject(item) && Boa().isObject(cachedItem) && item.id && cachedItem.id) {
            // Skip all-prop check if IDs are present and do/don't match
            if (item.id == cachedItem.id) return true;
            else return false;
        }
        if (!item || !cachedItem) return false;

        for (const key of Object.getOwnPropertyNames(item)) {
            if (!Object.getOwnPropertyNames(cachedItem).includes(key)) return false;
            if (typeof item[key] === 'object' && Boa().isObject(item[key]) && item[key]) return this.matches(item[key], cachedItem[key]);
            else if (item[key] !== cachedItem[key]) return false;
        }
        return true;
    }

    get(idOrObject) {
        if (typeof idOrObject === 'string' || typeof idOrObject === 'number') {
            //ID:
            return super.get("" + idOrObject);
        }
        else {
            //Object:
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