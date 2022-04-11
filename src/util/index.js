
const { Collection } = require('discord.js');
const { is } = require('express/lib/request');
const { get } = require('express/lib/response');
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

    /**
     * Parses a string, date, number, or bigint representing a time and returns its value in milliseconds.
     * All returned and specified time values should be relative to the current time (e.g. 2 minutes from now, 5 hours ago, etc).
     * Depending on the datatype specified, the unit of time will differ:
     * - Number: Relative milliseconds.
     * - String: Any relative time, such as milliseconds, seconds, minutes, hours, days, etc. and their abbreviations.
     * - BigInt: Relative minutes.
     * - undefined: 0 relative milliseconds (the current time).
     * - other: null
     * All specified datatypes will return the equivalent value in milliseconds.
     * @example
     * parseTime(100); // => 100
     * parseTime("150"); // => 150
     * parseTime("1h"); // => 3600000
     * parseTime("2m"); // => 120000
     * parseTime(5n); // => 300000
     * parseTime(); // => 0
     * parseTime("invalid time"); // => null
     * parseTime(null); // => null
     * parseTime(false); // => null
     * @param {String|Number|BigInt} [time] - The time to parse.
     * @returns {Number} The parsed time in milliseconds.
     */
    parseTime(time) {
        const Timestamp = require('../structures/Timestamp');
        return Timestamp.fromRelativeTime(time).asNumber();
    },

    /**
     * Converts the specified milliseconds or time string into a human-readable time string.
     * @example
     * formatTime(100); // => "100ms"
     * formatTime("150"); // => "150ms"
     * formatTime(100, true); // => "100 milliseconds"
     * formatTime("1h", true); // => "1 hour"
     * formatTime("2m"); // => "2m"
     * @param {Number|String} milliseconds - The milliseconds or time string to format as a human-readable time string.
     * @param {Boolean} long - Whether to format as a long string (i.e. "5 minutes" instead of "5m"). Defaults to false (short string).
     * @returns {String} The formatted, human-readable time string.
     */
    formatTime(milliseconds, long = false) {
        if (typeof milliseconds === 'string') milliseconds = ms(milliseconds);
        const ms = require('ms');
        return ms(milliseconds, { long });
    },

    /**
     * Parses all unicode and discord emotes from a string and returns them in an array.
     * @param {String} str - The string to parse.
     * @param {Number} [n] - The optional maximum number of emotes to return, starting from the beginning of the string.
     * @returns {String[]} An array of all unicode and discord emotes in the string.
     */
    emotes(str, n = 0) {
        const emotes = str.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu) ?? [];
        return n ? emotes.slice(0, n) : emotes;
    },

    /**
     * Parses a string and removes any unicode or discord emotes within it.
     * @param {String} str - The string to parse.
     * @param {Number} [n] - The optional maximum number of emotes to remove, starting from the beginning of the string.
     * @returns {String} The string without any unicode or discord emotes.
     */
    nonemotes(str, n = Infinity) {
        let i = 0;
        return str.replace(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu, match => {
            if (++i > n) return match;
            return '';
        }).trim();
    },

    /**
     * Parses a hex string/number and returns whether it is closest to red, green, blue, black, white, gray or none of the above.
     * @param {String|Number} hex - The hex color to parse.
     * @returns {"red"|"green"|"blue"|"black"|"white"|"gray"|"unknown"}
     */
    hexToRgbColorName(hex) {
        const toHexString = () => {
            if (typeof hex === 'number') {
                let str = hex.toString(16);
                return "0".repeat(6 - str.length) + str;
            }
            else return ("" + hex).replace("#", "");
        };
        
        const [R, G, B] = toHexString().replace(/^([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => '' + r + r + g + g + b + b)
        .match(/.{2}/g)
        .map(x => parseInt(x, 16))

        // Check black/white
        if (R <= 10 && G <= 10 && B <= 10) return "black";
        if (R >= 245 && G >= 245 && B >= 245) return "white";
    
        // Check grays
        if (Math.abs(R - G) <= 20 && Math.abs(G - B) <= 20 && Math.abs(R - B) <= 20) return "gray";

        // Check dominance
        if (R > 100)
            return "red";
        if (G > 100)
            return "green";
        if (B > 100)
            return "blue";
    
        // Check majority
        if (R > G && R > B)
            return "red";
        if (G > R && G > B)
            return "green";
        if (B > R && B > G)
            return "blue";

        return "unknown"
    },

    asMessageOptions(optsOrContent) {
        if (typeof optsOrContent === "string") optsOrContent = {content: optsOrContent};
        return optsOrContent ?? {};
    },

    asReplyOptions(optsOrContent, ephemeral = false) {
        return {
            ...module.exports.asMessageOptions(optsOrContent),
            fetchReply: true,
            ephemeral
        };
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

    AppliableInterface: class AppliableInterface {

        static applyToClass(target, ignore = []) {
            ignore.push("constructor");
            for (const prop of Object.getOwnPropertyNames(this.prototype)) {
                if (ignore.includes(prop) || prop.startsWith("#") || prop.startsWith("_")) continue;
                Object.defineProperty(
                    target.prototype,
                    prop,
                    Object.getOwnPropertyDescriptor(this.prototype, prop)
                );
            }
        }

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

    users(structure, ...ids) {
        const UserManager = require('../managers/UserManager');
        const users = new UserManager(structure.users);
        if (ids.flat().length) return users.filter(u => ids.flat().includes(u.id));
        return users;
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
        const SendableComponentFactory = require('../structures/SendableComponentFactory');
        const embed = new MessageEmbed(module.exports.asMessageOptions(optsOrContent));

        return new SendableComponentFactory({
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
            toJSON() {
                return { ...embed };
            },
            set(optsOrContent) {
                embed.set(optsOrContent);
                return this;
            },
            debug() {
                console.log(JSON.stringify(this.get(), null, '\t'));
                return this;
            }
        });
    },

    /**
     * @typedef {Object} ButtonFactory
     * @property {(customId: string) => ButtonFactory} customId - Sets the customId of the button
     * @property {(disabled: boolean) => ButtonFactory} disabled - Sets whether the button is disabled
     * @property {(emote: string) => ButtonFactory} emoji - Sets the emoji of the button
     * @property {(label: string, ignoreEmoteParsing: boolean) => ButtonFactory} label - Sets the label of the button. Automatically parses present emojis and sets them as the emoji of the button, by default.
     * @property {(color: string) => ButtonFactory} color - Sets the color of the button
     * @property {(url: string) => ButtonFactory} url - Sets the url of the button. Automatically sets the style to "URL"
     * @property {(style: string) => ButtonFactory} style - Sets the style of the button. Works the same as color()
     * @property {(uses: number, callback: (button: import('../structures/SentMessageButton')) => void) => ButtonFactory} maxUses - Sets the maximum number of uses of the button, and the callback to be called once the button has been used that many times
     * @property {(ms: number, callback: (button: import('../structures/SentMessageButton')) => void) => ButtonFactory} maxTime - Sets the maximum time the button will work for, and the callback to be called once the time limit expires
     * @property {(usersOrRoles: string[]) => ButtonFactory} acceptsClicksFrom - Sets the IDs of users and roles that can click the button. Defaults to all users and roles
     * @property {(row: number, col: number) => ButtonFactory} coords - Sets the row and column of the button. Defaults to the last available row and column
     * @property {(handler: (interaction: import('../structures/ComponentInteraction') & import('../structures/SentMessageButton')) => void) => ButtonFactory} onClick - Sets the handler to be called each time the button is clicked
     * @property {(handler: (interaction: import('../structures/SentMessageButton'), reason: "uses"|"time") => void) => ButtonFactory} onEnd - The handler to be called once the button-handling has ended (once max time or uses has been reached).
     * @property {() => MessageButtonResolvable} toJSON - Returns the JSON representation of the button
     */

    /**
     * @typedef {Object} MessageButtonResolvable
     * @property {string} customId - The customId of the button
     * @property {boolean} [disabled = false] - Whether the button is disabled
     * @property {string} [emoji] - The emoji of the button
     * @property {string} label - The label of the button. If emotes are present, automatically parses and sets them as the emoji of the button
     * @property {string} [labelIgnoreEmoteParsing] - Works the same as label, but without automatic emote parsing. This works the same as labels in default Discord.js
     * @property {string|number} [color = "PRIMARY"] - The color, or style, of the button. The name of a color, a hex string, or a hex number can be provided
     * @property {string} [url] - The url of the button. Automatically sets the style to URL
     * @property {string|number} [style = "PRIMARY"] - The style of the button, works the same as color but is overrided by color
     * @property {{uses: number, callback?: (button: import('../structures/SentMessageButton')) => void}} [maxUses] - The maximum number of uses of the button, and the callback to be called once the button has been used that many times
     * @property {{time: number|string|bigint, callback?: (button: import('../structures/SentMessageButton')) => void}} [maxTime] - The maximum time the button will work for, and the callback to be called once the time limit expires
     * @property {string[]} [acceptsClicksFrom] - The IDs of users and roles that can click the button. Defaults to all users and roles
     * @property {number} [row] - The row of the button. Defaults to the last available row. Required if col is provided
     * @property {number} [col] - The column of the button. Defaults to the last available column in the selected row
     * @property {(interaction: import('../structures/ComponentInteraction') & import('../structures/SentMessageButton')) => void} [onClick] - The handler to be called each time the button is clicked
     * @property {(interaction: import('../structures/SentMessageButton'), reason: "uses"|"time") => void} [onEnd] - The handler to be called once the button-handling has ended (once max time or uses has been reached).
     */

    /**
     * @param {String|MessageButtonResolvable} [optsOrContent] - The options or label of the button to create
     * @returns {ButtonFactory}
     */
    button(optsOrContent = {}) {
        const { MessageButton } = require("discord.js");
        const SendableComponentFactory = require('../structures/SendableComponentFactory');
        const SentMessageButton = require('../structures/SentMessageButton');
        const throws = (err) => { throw new Error(err) };

        const opts = { ...(typeof optsOrContent === "string" ? { label: optsOrContent } : optsOrContent) };
        const settings = new Map([ // All added custom button settings
            ["handler", opts.onClick ?? (() => null)],
            ["endHandler", opts.onEnd ?? (() => null)],
            ["maxUses", opts.maxUses ?? {
                uses: 0,
                callback: () => null
            }],
            ["maxTime", opts.maxTime ?? {
                time: 0,
                callback: () => null
            }],
            ["canClick", opts.acceptsClicksFrom ?? []],
            ["row", opts.row ?? null],
            ["col", opts.col ?? null]
        ]);
        const btn = new MessageButton(opts);

        // All added factory methods specific to buttons
        const customMethods = {
            customId(id = throws("At button(): No ID specified.")) {
                btn.setCustomId(id);
                return this;
            },
            disabled(disabled = true) {
                btn.setDisabled(disabled);
                return this;
            },
            emoji(resolvableEmote = throws("At button(): No emoji specified.")) {
                btn.setEmoji(resolvableEmote);
                return this;
            },
            label(label = throws("At button(): No label specified."), ignoreEmoteParsing = false) {
                label = SentMessageButton.parseLabel(label, ignoreEmoteParsing);

                btn.setLabel(label);
                return this;
            },
            color(color = throws("At button(): No color specified.")) {
                if (btn.url) return this;
                const style = SentMessageButton.parseColor(color);

                if (style) btn.setStyle(style);
                else console.warn("Unknown color", color, "set by button().color()")

                return this;
            },
            url(url = throws("At button(): No url specified.")) {
                btn.setStyle("LINK");
                btn.setURL(url);
                return this;
            },
            style(style = throws("At button(): No style specified.")) {
                // Same as color, present for consistency with Discord API button structure
                return this.color(style);
            },
            maxUses(uses = 0, callback = () => null) {
                const maxUses = settings.get("maxUses");
                maxUses.uses = uses;
                maxUses.callback = callback;
                return this;
            },
            maxTime(ms = 0, callback = () => null) {
                const maxTime = settings.get("maxTime");
                maxTime.time = module.exports.parseTime(ms);
                maxTime.callback = callback;
                return this;
            },
            acceptsClicksFrom(usersOrRoles = []) {
                settings.set("canClick", usersOrRoles);
                return this;
            },
            coords(row = null, col = null) {
                settings.set("row", row);
                settings.set("col", col);
                return this;
            },
            onClick(handler = throws("At button(): No click handler specified.")) {
                settings.set("handler", handler);
                return this;
            },
            onEnd(handler = throws("At button(): No end handler specified.")) {
                settings.set("endHandler", handler);
                return this;
            },
            toJSON() {
                return { ...btn.toJSON(), ...settings };
            },
            /** @private */
            onSend(message) {
                if (!message) return;
                const client = /** @type {import('../client/Client')} */ (message.client);
                const ComponentInteraction = require('../structures/ComponentInteraction');
                const sentButton = new SentMessageButton(btn, message);
                let calls = 0;

                const handler = settings.get("handler");
                const endHandler = settings.get("endHandler");
                const canClick = settings.get("canClick");
                const maxUses = settings.get("maxUses");
                const maxTime = settings.get("maxTime");

                if (maxTime.time) setTimeout(() => {
                    if (calls > -1) {
                        maxTime.callback(sentButton);
                        endHandler(sentButton, "time");
                    }
                    calls = -1;
                }, maxTime.time);

                if (handler || canClick.length || maxUses.uses) client?.onRaw("interactionCreate", i => {
                    if (!i.isButton() || !i.customId == btn.customId) return;
                    const buttonInteraction = ComponentInteraction.asButton(i);

                    if (calls < 0) return;
                    if (canClick.length && !canClick.some(id => buttonInteraction.user.id === id || buttonInteraction.member.roles.has(id))) return;
                    if (maxUses.uses && calls >= maxUses.uses) return;
                    calls++;
                    
                    handler(buttonInteraction);
                    if (maxUses.uses && calls == maxUses.uses) {
                        calls = -1;
                        maxUses.callback(buttonInteraction);
                        return endHandler(sentButton, "uses");
                    }
                });
            }
        };

        // Call custom methods that have modified behavior from the base or that use custom property names
        if (opts.label) customMethods.label(opts.label);
        else if (opts.labelIgnoreEmoteParsing) customMethods.label(opts.labelIgnoreEmoteParsing, true);
        if (opts.color) customMethods.color(opts.color);
        else if (opts.style) customMethods.style(opts.style);
        if (opts.url) customMethods.url(opts.url);

        return new SendableComponentFactory(customMethods);
    },

    CREATE_MESSAGE_CUSTOM_METHODS: {},

    createMessage(optsOrContent) {
        const SendableComponentFactory = require('../structures/SendableComponentFactory');
        const sendableComponentFactories = [];

        return {
            messageData: {
                ...module.exports.asMessageOptions(optsOrContent)
            },
            ...module.exports.CREATE_MESSAGE_CUSTOM_METHODS,
            embed(/** @type {EmbedResolvable|(e: EmbedFactory) => void} */ f) {
                let embedData = module.exports.embed();
                if (typeof f === 'function') embedData = f(embedData) ?? embedData;
                else embedData = module.exports.embed(f);

                if (embedData instanceof SendableComponentFactory) {
                    sendableComponentFactories.push(embedData);
                }

                this.messageData.embeds = [].concat(this.messageData.embeds ?? []).concat(embedData);
                return this;
            },
            component(component, [row, col] = [null, null]) { //Adds a generic message component to the message
                const simulatedMessage = {
                    components: this.messageData.components ?? [],
                    edit: () => null
                };

                const ComponentManager = require('../managers/ComponentManager');
                const componentManager = new ComponentManager(simulatedMessage);

                if (component instanceof SendableComponentFactory) {
                    sendableComponentFactories.push(component);
                    [row, col] = [row ?? component.toJSON().row, col ?? component.toJSON().col];
                }

                if (col !== null && col !== undefined) componentManager.set(component, row, col);
                else componentManager.add(component, row);

                this.messageData.components = simulatedMessage.components;
                return this;
            },
            /** @param {MessageButtonResolvable|(b: ButtonFactory) => void} f */
            button(f) {
                let buttonData = module.exports.button();
                if (typeof f === 'function') buttonData = f(buttonData) ?? buttonData;
                else buttonData = module.exports.button(f);

                return this.component(buttonData);
            },
            // TODO: add select menu builder
            // TODO: add addPage() builder for pagination
            /**
             * @returns {import('../structures/Message')}
             */
            async send(channel) {
                const m = await channel?.send(this.messageData);
                sendableComponentFactories.forEach(f => f.onSend(m));
                return m;
            },
            async reply(messageOrInteraction) {
                const m = await messageOrInteraction?.reply(this.messageData);
                sendableComponentFactories.forEach(f => f.onSend(m));
                return m;
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

    /**
     * Finds the value in the Emap whose f(value) numeric result is the largest.
     * @param {Function} f - A function that takes a value and returns a number.
     * @returns The Emap value whose number result, from f(value), is the largest.
     */
    findMax(f) {
        let max = 0;
        let maxItem = null;
        this.each(x => max < (max = Math.max(max, f(x))) && (maxItem = x));
        return maxItem;
    }

    /**
     * Finds the value in the Emap whose f(value) numeric result is the smallest.
     * @param {Function} f - A function that takes a value and returns a number.
     * @returns The Emap value whose number result, from f(value), is the smallest.
     */
    findMin(f) {
        let min = 0;
        let minItem = null;
        this.each(x => min > (min = Math.min(min, f(x))) && (minItem = x));
        return minItem;
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

class Edict extends Emap {

    constructor(iterable = []) {
        super(iterable);
        this.edict = true;

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
module.exports.Edist = Edict;