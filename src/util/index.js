
const { Collection } = require('discord.js');
const Boa = require('./Boa');

module.exports = {

    /**
     * @private
     */
    parseBuilder(objOrBuilder, Builder) {
        if (typeof objOrBuilder === 'function') {
            const b = new Builder();
            return objOrBuilder(b) ?? b;
        }
        return objOrBuilder;
    },

    /**
     * Loads a token from a JSON file, if one exists.
     * @param {String} JSONpath - The absolute path to a JSON file.
     * @returns {String?}
     */
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

    /**
     * A basic random number generator that accepts a range of min-max.
     * @param {Number} min - The minimum of the range to generate a random number from, inclusive.
     * @param {Number} max - The maximum of the range to generate a random number from, inclusive.
     * @returns Generated random number between min and max, both inclusive.
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * A simple way to debug any method.
     * Logs messages before and after the provided method is run, identifying whether the method works and what errors it may cause.
     * @param {Function} method - The method to run and debug.
     * @param  {...any} args - The arguments to pass to the 'method' function.
     */
    debugMethod(method, ...args) {
        const methodName = method.name ?? "<anonymousFunction>";
        console.log(`[1/2] About to execute ${methodName}()...`);

        try {
            method(...args);
        }
        catch (e) {
            throw new Error(`[2/2] Error executing ${methodName}(): ${e.message}`);
        }

        console.log(`[2/2] Successfully executed ${methodName}() with no caught errors...`);
    },

    /**
     * Check the filesize of the file at the specified path. Does not work on directories.
     * @param {String} path - The absolute path to the file to check the size of.
     * @returns The filesize of the file at the specified path, in MB.
     */
    filesize(path) {
        const fs = require('fs');

        if (!fs.existsSync(path) || fs.statSync(path).isDirectory()) return 0;
        let size = fs.statSync(path).size;

        if (size < 1024) return size + " B";
        if (size < 1048576) return (size / 1024).toFixed(2) + " KB";
        if (size < 1073741824) return (size / 1048576).toFixed(2) + " MB";
        if (size < 1099511627776) return (size / 1073741824).toFixed(2) + " GB";
        return (size / 1099511627776).toFixed(2) + " TB";
        
        // if (size < 1125899906842624) return (size / 1099511627776).toFixed(2) + " TB";
        // if (size < 1152921504606846976) return (size / 1125899906842624).toFixed(2) + " PB";
        // if (size < 1180591620717411303424) return (size / 1152921504606846976).toFixed(2) + " EB";
        // if (size < 1208925819614629174706176) return (size / 1180591620717411303424).toFixed(2) + " ZB";
        // if (size < 1237940039285380274899124224) return (size / 1208925819614629174706176).toFixed(2) + " YB";

    },

    /**
     * Returns percent of string similarity based on Levenshtein Distance.
     * Based on https://stackoverflow.com/a/36566052/6901876.
     * @param {String} s1 - The first string to compare.
     * @param {String} s2 - The second string to compare.
     * @returns The percent of similarity between the two strings.
     */
    similarity(s1, s2) {
        function editDistance(s1, s2) {
            s1 = s1.toLowerCase();
            s2 = s2.toLowerCase();
          
            var costs = new Array();
            for (var i = 0; i <= s1.length; i++) {
              var lastValue = i;
              for (var j = 0; j <= s2.length; j++) {
                if (i == 0)
                  costs[j] = j;
                else {
                  if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                      newValue = Math.min(Math.min(newValue, lastValue),
                        costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                  }
                }
              }
              if (i > 0)
                costs[s2.length] = lastValue;
            }
            return costs[s2.length];
        }

        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        var longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }
        return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
    },

    /**
     * Returns the provided array of Strings, sorted based on similarity to the provided string
     * @param {String[]} strs - Array of Strings to compare to cStr.
     * @param {String} cStr - The string to compare against the array of Strings.
     * @param {Number|"dynamic"} [rThreshold] - Number 0.0-1.0 percent similarity that all returned Strings must be, compared to cStr. Strings below this threshold in similarity will not be returned
     * @param {Number} [sThreshold] - Number 0.0-1.0 percent similarity that guarantees only one string is returned.
     */
    sortedSimilar(strs, cStr, rThreshold = 0.0, sThreshold) {
        let res = strs.filter(s => {
            let threshold = rThreshold;
            if (rThreshold == "dynamic") threshold = cStr.length / s.length - 0.1;
            if (threshold > 1) threshold = 0.9;

            return module.exports.similarity(s, cStr) > threshold;
        }).sort((s1, s2) => {
            return module.exports.similarity(s1, cStr) - this.similarity(s2, cStr);
        });
        
        if (sThreshold !== null) {
            let sRes = res.filter(s => this.similarity(s, cStr) > sThreshold);
            if (sRes.length > 0) res = [sRes[0]];
        }

        return res;
    },

    /**
     * Returns a function that accepts a slash command argument and returns the choices that match it closest, sorted by similarity.
     * Built for use with Elisif's util.command() autocomplete option.
     * @param {Choice[]} choices - An array of values to compare to the slash command argument.
     * @returns {({name:string, value:string}, interaction) => Choice[]} A function that returns some or all of the provided choices.
     */
    commandAutocompleter(choices) {
        return ({ value }) => {
            if (!value) value = "";
            value = String(value);
            if (value.length < 1) return choices;

            const results = module.exports.sortedSimilar(choices, value, "dynamic", 0.95);
            const directMatch = results.filter(r => r.toLowerCase().startsWith(value.toLowerCase()));

            if (!directMatch.length) return results;
            else return [...new Set([...directMatch, ...results]).values()];
        };
    },

    /** @private */
    asMessageOptions(optsOrContent) {
        if (typeof optsOrContent === "string") optsOrContent = {content: optsOrContent};
        return optsOrContent ?? {};
    },

    /** @private */
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
        for (const key in source) if (!(key in target)) Object.defineProperty(target, key, { value: source[key], writable: true, configurable: true, enumerable: true });

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

    /** @private */
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

    /** @returns {Emap} */
    guilds(structure, ...ids) {
        const GuildManager = require('../managers/GuildManager');
        const guilds = new GuildManager(structure.guilds);
        if (ids.flat().length) return guilds.filter(g => ids.flat().includes(g.id));
        return guilds;
    },

    /** @returns {Emap} */
    channels(structure, ...ids) {
        const ChannelManager = require('../managers/ChannelManager');
        const channels = new ChannelManager(structure.channels);
        if (ids.flat().length) return channels.filter(c => ids.flat().includes(c.id));
        return channels;
    },

    /** @returns {Emap} */
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
     * @property {() => MessageEmbed} toJSON - Returns the embed object
     * @property {() => EmbedFactory} debug - Readably stringifies and logs the embed object to console
     */

    /**
     * @typedef {Object} MessageEmbedResolvable
     * @property {{name:string, value:string, inline:boolean}[]} fields - Sets the fields of the embed
     * @property {{name:string, url:string, iconURL:string}} author - Sets the author of the embed
     * @property {string|number} color - Sets the color of the embed
     * @property {string} description - Sets the description of the embed
     * @property {string} content - Sets the content of the embed's message
     * @property {{text:string, iconURL:string}} footer - Sets the footer of the embed
     * @property {{url:string}} image - Sets the image of the embed
     * @property {{url:string}} thumbnail - Sets the thumbnail of the embed
     * @property {data|number} timestamp - Sets the timestamp of the embed
     * @property {string} title - Sets the title of the embed
     * @property {string} url - Sets the URL of the title of the embed
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
            send(channel, opts, ...args) {
                return channel?.send({ embed, ...opts }, ...args);
            },
            toJSON() {
                const output = embed.toJSON();
                if (output.fields && !output.fields.length) output.fields = null;
                return output;
            },
            onSend() {
                return null;
            },
            set(optsOrContent) {
                embed.set(optsOrContent);
                return this;
            },
            debug() {
                console.log(JSON.stringify(this.toJSON(), null, '\t'));
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
     * @property {({time: number|string|bigint, row: MessageButtonResolvable[]}) => ButtonFactory} toggleRow - Toggles the visibility of the provided component row whenever the button is clicked. The row auto-hides after the provided time, if specified. Can be specified along with or in place of onClick.
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
     * @property {{time: number|string|bigint, row: MessageButtonResolvable[]}} [toggleRow] - Toggles the visibility of the provided component row whenever the button is clicked. The row auto-hides after the provided time, if specified. Can be specified along with or in place of onClick.
     * @property {number} [row] - The row of the button. Defaults to the last available row. Required if col is provided
     * @property {number} [col] - The column of the button. Defaults to the last available column in the selected row
     * @property {(interaction: import('../structures/ComponentInteraction') & import('../structures/SentMessageButton')) => void} [onClick] - The handler to be called each time the button is clicked
     * @property {(interaction: import('../structures/SentMessageButton'), reason: "uses"|"time") => void} [onEnd] - The handler to be called once the button-handling has ended (once max time or uses has been reached).
     */

    /**
     * @param {String|MessageButtonResolvable} [optsOrContent] - The options or label of the button to create
     * @returns {ButtonFactory}
     */
    button(optsOrContent) {
        const { MessageButton } = require("discord.js");
        const SendableComponentFactory = require('../structures/SendableComponentFactory');
        const SentMessageButton = require('../structures/SentMessageButton');
        const throws = (err) => { throw new Error(err) };

        const opts = /** @type {MessageButtonResolvable} */ ({ ...(typeof optsOrContent === "string" ? { label: optsOrContent } : optsOrContent) });
        const settings = new Map([ // All added custom button settings
            ["handler", opts.onClick ?? (() => "noreply")],
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
            ["toggleableRow", opts.toggleRow ?? {
                time: 0,
                row: []
            }],
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
                label = SentMessageButton.parseLabel(label, ignoreEmoteParsing, btn);

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
            toggleRow(row = throws("At button(): No row specified."), ms = 0) {
                ms = module.exports.parseTime(ms);
                settings.set("toggleableRow", {
                    row,
                    ms
                });
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
            /**
             * @private
             */
            toJSON() {
                return { ...btn, ...settings, toJSON: btn.toJSON.bind(btn) };
            },
            /** 
             * @private
             * @param {import("../structures/Message")} message
             */
            onSend(message) {
                if (!message) return;
                const components = require('./components');
                const sentButton = new SentMessageButton(btn, message);

                const handler = settings.get("handler");
                const endHandler = settings.get("endHandler");
                const canClick = settings.get("canClick");
                const toggleableRow = settings.get("toggleableRow");
                const maxUses = settings.get("maxUses");
                const maxTime = settings.get("maxTime");

                const comp = {
                    type: "button",
                    calls: 0,
                    handler,
                    endHandler,
                    canUse: canClick,
                    toggleableRow,
                    maxUses,
                    maxTime,
                    sent: sentButton
                }

                components.add(comp);
            }
        };

        // Default style
        customMethods.color("PRIMARY");

        // Call custom methods that have modified behavior from the base or that use custom property names
        if (opts.label) customMethods.label(opts.label);
        else if (opts.labelIgnoreEmoteParsing) customMethods.label(opts.labelIgnoreEmoteParsing, true);
        if (opts.color) customMethods.color(opts.color);
        else if (opts.style) customMethods.style(opts.style);
        if (opts.url) customMethods.url(opts.url);

        return new SendableComponentFactory(customMethods);
    },

    /**
     * @typedef {Object} SelectMenuFactory
     * @property {(customId: string) => SelectMenuFactory} customId - Sets the customId of the select menu
     * @property {(disabled: boolean) => SelectMenuFactory} disabled - Sets whether the select menu is disabled
     * @property {(placeholder: string) => SelectMenuFactory} placeholder - Sets the placeholder of the select menu.
     * @property {(max: number) => SelectMenuFactory} max - Sets the maximum number of values that can be selected at once.
     * @property {(min: number) => SelectMenuFactory} min - Sets the minimum number of values that can be selected at once.
     * @property {(option: string|{ label: string, value?: string, description?: string, emoji?: string, default?: boolean, ignoreEmoteParsing?: boolean }) => SelectMenuFactory} option - Adds an option to the select menu.
     * @property {(...options: (string|{ label: string, value?: string, description?: string, emoji?: string, default?: boolean, ignoreEmoteParsing?: boolean })) => SelectMenuFactory} options - Adds multiple options to the select menu.
     * @property {(uses: number, callback?: (menu: import('../structures/SentMessageSelectMenu')) => void) => SelectMenuFactory} maxUses - Sets the maximum number of uses of the select menu, and the callback to be called once the select menu has been used that many times
     * @property {(ms: number, callback?: (menu: import('../structures/SentMessageSelectMenu')) => void) => SelectMenuFactory} maxTime - Sets the maximum time the select menu will work for, and the callback to be called once the time limit expires
     * @property {(usersOrRoles: string[]) => SelectMenuFactory} acceptsSelectionsFrom - Sets the IDs of users and roles that can use the select menu. Defaults to all users and roles
     * @property {({time: number|string|bigint, row: MessageSelectMenuResolvable[]}) => SelectMenuFactory} toggleRow - Toggles the visibility of the provided component row whenever the select menu is used. The row auto-hides after the provided time, if specified. Can be specified along with or in place of onSelect.
     * @property {(row: number) => SelectMenuFactory} coords - Sets the row of the select menu. Defaults to the last available row, and column is always set to 0.
     * @property {(handler: (interaction: import('../structures/ComponentInteraction') & import('../structures/SentMessageSelectMenu') & { selected: string }) => void) => SelectMenuFactory} onSelect - Sets the handler to be called each time the select menu is used
     * @property {(handler: (interaction: import('../structures/SentMessageSelectMenu') & { selected: string }, reason: "uses"|"time") => void) => SelectMenuFactory} onEnd - The handler to be called once the select-menu-handling has ended (once max time or uses has been reached).
     * @property {() => MessageSelectMenuResolvable} toJSON - Returns the JSON representation of the button
     */

    /**
     * @typedef {Object} MessageSelectMenuResolvable
     * @property {string} customId - The customId of the select menu
     * @property {boolean} [disabled = false] - Whether the select menu is disabled
     * @property {string} placeholder - The placeholder of the select menu
     * @property {number} [max = 0] - The maximum number of values that can be selected at once
     * @property {number} [min = 0] - The minimum number of values that can be selected at once
     * @property {(string|{ label: string, value?: string, description?: string, emoji?: string, default?: boolean, ignoreEmoteParsing?: boolean })[]} options - The options of the select menu
     * @property {{uses: number, callback?: (menu: import('../structures/SentMessageSelectMenu')) => void}} [maxUses] - The maximum number of uses of the select menu, and the callback to be called once the select menu has been used that many times
     * @property {{time: number|string|bigint, callback?: (menu: import('../structures/SentMessageSelectMenu')) => void}} [maxTime] - The maximum time the select menu will work for, and the callback to be called once the time limit expires
     * @property {string[]} [acceptsSelectionsFrom] - The IDs of users and roles that can use the select menu. Defaults to all users and roles
     * @property {{time: number|string|bigint, row: MessageSelectMenuResolvable[]}} [toggleRow] - Toggles the visibility of the provided component row whenever the select menu is used. The row auto-hides after the provided time, if specified. Can be specified along with or in place of onSelect.
     * @property {number} [row] - The row of the select menu. Defaults to the last available row
     * @property {(interaction: import('../structures/ComponentInteraction') & import('../structures/SentMessageSelectMenu') & { selected: string }) => void} [onSelect] - Sets the handler to be called each time the select menu is used
     * @property {(interaction: import('../structures/SentMessageSelectMenu') & { selected: string }, reason: "uses"|"time") => void} [onEnd] - The handler to be called once the select-menu-handling has ended (once max time or uses has been reached).
     */

    /**
     * @param {String|MessageSelectMenuResolvable} [optsOrContent] - The options or placeholder of the select menu to create
     * @returns {SelectMenuFactory}
     */
    selectMenu(optsOrContent) {
        const { MessageSelectMenu } = require("discord.js");
        const SendableComponentFactory = require('../structures/SendableComponentFactory');
        const SentMessageSelectMenu = require('../structures/SentMessageSelectMenu');
        const throws = (err) => { throw new Error(err) };

        const opts = /** @type {MessageSelectMenuResolvable} */ ({ ...(typeof optsOrContent === "string" ? { placeholder: optsOrContent } : optsOrContent) });
        const settings = new Map([ // All added custom menu settings
            ["handler", opts.onSelect ?? (() => "noreply")],
            ["endHandler", opts.onEnd ?? (() => null)],
            ["maxUses", opts.maxUses ?? {
                uses: 0,
                callback: () => null
            }],
            ["maxTime", opts.maxTime ?? {
                time: 0,
                callback: () => null
            }],
            ["canSelect", opts.acceptsSelectionsFrom ?? []],
            ["toggleableRow", opts.toggleRow ?? {
                time: 0,
                row: []
            }],
            ["row", opts.row ?? null],
            ["col", null]
        ]);

        const providedMenuOptions = opts.options;
        if (opts.options) delete opts.options; // Prevent option normalization error

        const menu = new MessageSelectMenu(opts);
        opts.options = providedMenuOptions;

        // All added factory methods specific to select menus
        const customMethods = {
            customId(id = throws("At selectMenu(): No ID specified.")) {
                menu.setCustomId(id);
                return this;
            },
            disabled(disabled = true) {
                menu.setDisabled(disabled);
                return this;
            },
            placeholder(placeholder = throws("At selectMenu(): No placeholder specified.")) {
                menu.setPlaceholder(placeholder);
                return this;
            },
            max(selections = throws("At selectMenu(): No max selections specified.")) {
                menu.setMaxValues(selections);
                return this;
            },
            min(selections = throws("At selectMenu(): No min selections specified.")) {
                menu.setMinValues(selections);
                return this;
            },
            option(option = throws("At selectMenu(): No option specified."), optionalDescription = null) {
                if (typeof option === "string") option = { label: option };
                let { label, value = null, description = optionalDescription, emoji = null, default: selected = null, ignoreEmoteParsing = false } = option;

                value ??= label;
        
                const parsedLabel = SentMessageSelectMenu.parseLabelAndEmote(label, ignoreEmoteParsing);
                label = parsedLabel.label;
                emoji ??= parsedLabel.emote;

                menu.addOptions({
                    label,
                    value,
                    description,
                    emoji,
                    default: selected
                })

                return this;
            },
            options(...opts) {
                for (const opt of opts.flat()) this.option(opt);
                return this;
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
            acceptsSelectionsFrom(usersOrRoles = []) {
                settings.set("canSelect", usersOrRoles);
                return this;
            },
            toggleRow(row = throws("At selectMenu(): No row specified."), ms = 0) {
                ms = module.exports.parseTime(ms);
                settings.set("toggleableRow", {
                    row,
                    ms
                });
                return this;
            },
            coords(row = null) {
                settings.set("row", row);
                settings.set("col", null); // Will default to 0
                return this;
            },
            onSelect(handler = throws("At selectMenu(): No selection handler specified.")) {
                settings.set("handler", handler);
                return this;
            },
            onEnd(handler = throws("At selectMenu(): No end handler specified.")) {
                settings.set("endHandler", handler);
                return this;
            },
            /**
             * @private
             */
            toJSON() {
                return { ...menu, ...settings, toJSON: menu.toJSON.bind(menu) };
            },
            /** 
             * @private
             * @param {import("../structures/Message")} message
             */
            onSend(message) {
                if (!message) return;
                const components = require('./components');
                const sentMenu = new SentMessageSelectMenu(menu, message);

                const handler = settings.get("handler");
                const endHandler = settings.get("endHandler");
                const canSelect = settings.get("canSelect");
                const toggleableRow = settings.get("toggleableRow");
                const maxUses = settings.get("maxUses");
                const maxTime = settings.get("maxTime");

                const comp = {
                    type: "menu",
                    calls: 0,
                    handler,
                    endHandler,
                    canUse: canSelect,
                    toggleableRow,
                    maxUses,
                    maxTime,
                    sent: sentMenu
                }

                components.add(comp);
            }
        };

        // Call custom methods that have modified behavior from the base or that use custom property names
        if (opts.options) customMethods.options(...opts.options);
        if (opts.max) customMethods.max(opts.max);
        if (opts.min) customMethods.min(opts.min);

        return new SendableComponentFactory(customMethods);
    },

    /**
     * Creates a new modal,or retrieves an existent modal.
     * All created modals are saved in a cache, and can be retrieved easily via their customId.
     * @param {String|import('../structures/BaseModal').BaseModalResolvable|import('../structures/BaseModal')} [optsOrId] - The options of the modal to create, or the base modal object or custom id of an existent modal
     * @returns {import('../structures/BaseModal')}
     */
    modal(optsOrId) {
        const BaseModal = require('../structures/BaseModal');
        return BaseModal.get(optsOrId);
    },

    /**
     * Parses an elisif message component from a resolvable or builder function form, into a SendableComponentFactory instance.
     * @param {MessageButtonResolvable | MessageSelectMenuResolvable | (c: ButtonFactory|SelectMenuFactory) => void} componentOrBuilder 
     * @returns {SendableComponentFactory<ButtonFactory|SelectMenuFactory>}
     */
    parseComponent(componentOrBuilder) {
        const identifiers = {
            button: module.exports.button,
            selectMenu: module.exports.selectMenu,

            type: null,

            builder: new Proxy({}, {
                get(_target, prop) {
                    identifiers.identify(prop);
                    return () => this;
                }
            }),
            identify: (prop) => {
                if (["label", "style", "color", "emoji"].includes(prop)) identifiers.type = "button"; // Solely for buttons
                else if (prop == "options" || prop == "option") identifiers.type = "selectMenu"; // Required for select menus
                else identifiers.type = "button"; // Default to button
            }
        };

        let component;
        if (typeof componentOrBuilder === 'function') {
            // Identify component type:
            componentOrBuilder(identifiers.builder);

            // Create component:
            let componentData = identifiers[identifiers.type]();
            component = componentOrBuilder(componentData) ?? componentData;
        }
        else {
            // Identify component type:
            for (const key of Object.keys(componentOrBuilder)) identifiers.identify(key);

            // Create component:
            component = identifiers[identifiers.type](componentOrBuilder);
        }

        return component;
    },

    /**
     * Properties added to this object can be used as custom builder methods in the `createMessage()` utility.
     * Such methods simply need to modify `this.messageData` with Discord.js message properties and return `this`.
     * 
     * This serves as an immensely simply way to extend and simplify message creation.
     * 
     * @example
     * // Define the custom builder:
     * CREATE_MESSAGE_CUSTOM_METHODS.blockQuote = function() {
     *  this.messageData.content = `> ${this.messageData.content}`;
     *  return this;
     * };
     * 
     * // Use the custom builder:
     * createMessage("Hello world!")
     * .blockQuote()
     * .send(yourChannel); // => Sends "> Hello world!" to yourChannel
     */
    CREATE_MESSAGE_CUSTOM_METHODS: {},

    /**
     * Creates a sendable message from the provided options and builder functions.
     * Heavily simplifies the process of adding embeds and components to a message.
     * @param {String|MessageResolvable} optsOrContent - The content or options of the message.
     */
    createMessage(optsOrContent) {
        const SendableComponentFactory = require('../structures/SendableComponentFactory');
        const sendableComponentFactories = [];

        return {
            messageData: {
                ...module.exports.asMessageOptions(optsOrContent)
            },
            ...module.exports.CREATE_MESSAGE_CUSTOM_METHODS,
            embed(/** @type {MessageEmbedResolvable|(e: EmbedFactory) => void} */ f) {
                let embedData = module.exports.embed();
                if (typeof f === 'function') embedData = f(embedData) ?? embedData;
                else embedData = module.exports.embed(f);

                if (embedData instanceof SendableComponentFactory) {
                    sendableComponentFactories.push(embedData);
                    embedData = embedData.toJSON();
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

                if (!(component instanceof require("discord.js").BaseMessageComponent) && !(component instanceof SendableComponentFactory)) component = module.exports.parseComponent(component) ?? component;
                if (component instanceof SendableComponentFactory) {
                    sendableComponentFactories.push(component);
                    [row, col] = [row ?? component.toJSON().row, col ?? component.toJSON().col];
                    component = component.toJSON();
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
            /** @param {MessageSelectMenuResolvable|(s: SelectMenuFactory) => void} f */
            selectMenu(f) {
                let menuData = module.exports.selectMenu();
                if (typeof f === 'function') menuData = f(menuData) ?? menuData;
                else menuData = module.exports.selectMenu(f);

                return this.component(menuData);
            },
            // TODO: add addPage() builder for pagination
            /**
             * @returns {import('../structures/Message')}
             */
            async send(channel, ...args) {
                const m = await channel?.send(this.messageData, ...args);
                sendableComponentFactories.forEach(f => f.onSend(m));
                return m;
            },
            async reply(messageOrInteraction, ...args) {
                const m = await messageOrInteraction?.reply(this.messageData, ...args);
                sendableComponentFactories.forEach(f => f.onSend(m));
                return m;
            },
            /**
             * Sends this message as another user.
             * (This method uses webhooks to simulate sending as another user).
             * 
             * Any @everyone and @here mentions in the message are automatically disabled, to avoid malicious use.
             * To disable the automatic mass-mention disabling, set `dataArgs.enableMassMentions` to `true`.
             * @returns {import('../structures/Message')}
             */
            async sendAs(user, channel, dataArgs) {
                const Message = require("../structures/Message");

                const webhook = await channel?.createWebhook(user?.username ?? user?.user?.username ?? "" + user, {
                    avatar: user?.displayAvatarURL?.() ?? user?.user?.displayAvatarURL?.(),
                    reason: `Simulating user: ${user}`
                });

                if (this.messageData.content && !dataArgs?.enableMassMentions) this.messageData.content = this.messageData.content.replace(/(\\|)@(everyone|here)/g, "*@*$2");
                let m;
                
                try {
                    m = await webhook?.send({
                        ...this.messageData,
                        ...dataArgs,
                        components: []
                    });
                }
                catch (err) {
                    user?.client?.debug(`\nAn error occurred while attempting to send a message as user: ${user}\n`, err.toString(), "\n");
                }

                // Errors in sending message are handled above to allow below webhook deletion to work:
                await webhook?.delete(`Finished simulating user: ${user}`);

                return m && new Message(m.client, m);
            },
            toJSON() {
                return this.messageData;
            }
        }
    },

    /**
     * Used to save information such as updated row and calls data.
     * @private
     */
    toggleComponentRowData: new Map(),

    /**
     * Toggles a component row on the specified message.
     * @param {import("../structures/Message")} message 
     * @param {{ row:(MessageButtonResolvable | MessageSelectMenuResolvable | (c: ButtonFactory|SelectMenuFactory) => void)[], time:Number|BigInt|String }} opts 
     * @returns {boolean}
     */
    async toggleComponentRow(message, opts) { // TODO: use toggleComponentRow() in button() and selectMenu()
        opts = module.exports.toggleComponentRowData.get(opts.row[0].customId) ?? opts;
        module.exports.toggleComponentRowData.set(opts.row[0].customId, opts);

        opts.calls ??= 0; // TODO: use TimeResolvable to document parsable times across module
        opts.calls++; // TODO: move all typedefs to separate file

        if (message.components.has(opts.row[0].customId)) {
            const index = message.components.get(opts.row[0].customId).row;
            opts.row = [...message.components.getRow(index).values()];

            await message.components.delete(index).catch(() => null);
        }
        else {
            const index = message.components.findMax(c => c.row).row + 1;
            await message.components.add(opts.row.map(c => {
                let b = module.exports.parseComponent(c);
                if (opts.calls == 1) b.onSend(message);
                return b.toJSON()
            }), index).catch(() => null);

            if (opts.timeout) clearTimeout(opts.timeout);
            if (opts.time) opts.timeout = setTimeout(module.exports.toggleComponentRow.bind(null, message, opts), module.exports.parseTime(opts.time));
        }
        
        return true;
    },

    /**
     * Creates a new elisif-syntax slash command with the given name and description.
     * @param {String} name - The name of the command.
     * @param {String} description - The description of the command.
     */
    command(name, description) {
        const SyntaxCommand = require('../structures/SyntaxCommand');
        return new SyntaxCommand(name, description);
    },

    /**
     * Creates a new elisif-syntax context menu command with the given name.
     * @param {String} name - The name of the context menu command.
     */
    contextMenu(name) {
        const SyntaxContextMenu = require('../structures/SyntaxContextMenu');
        return new SyntaxContextMenu(name);
    },

    /**
     * Creates a new asynchronous database instance, based on the provided filepath or database URL scheme.
     * Supports JSON files, SIFDB files, and URL schemes for several databases such as mongodb.
     * 
     * Powered by Sifbase.
     * @param {String} path - The absolute path to a JSON file, SIFDB file, or database URL scheme.
     */
    database(path) {
        const { Sifbase } = require('sifbase');
        return new Sifbase(path);
    },

    async debugDatabase(path, table) {
        const { Sifbase } = require('sifbase');
        const db = new Sifbase(path, table);

        const json = {};

        for await (const [k, v] of db) {
            json[k] = v;
        }

        return Boa().inspect(json);
    },

    /**
     * Creates a new asynchronous settings database for the provided structure or custom locale.
     * @param {String} databasePath - The absolute path to a file or database URL scheme, representing the database to use.
     * @param {*} structure - The structure to create settings for (e.g. a User or GuildMember instance).
     * @param {String} [customLocale] - The ID to use for the settings. Defaults to `structure.id`.
     */
    settings(databasePath, structure, customLocale) {
        // TODO: auto-determine databasePath from client config
        // TODO: add settings to ClientUser, User, Guild, and GuildMember
        const { BaseSettings } = require('../features/settings');
        return new BaseSettings(databasePath, customLocale ?? structure.id);
    },

    /**
     * Returns an IonHandler extended function/instance.
     * The returned value can be used as a function to create an ion event handler, the equivalent of IonHandler#on.
     * It can also be used as an object to execute the other IonHandler methods.
     * @returns {IonHandler}
     */
    ion(client, databasePath) {
        const IonHandler = require('../features/ion');
        return IonHandler.asFunction(client, module.exports.database(databasePath));
    },

    /**
     * Returns the Boa utilities -- several high-level utility functions including many based on Python's built-in methods.
     * @returns {Boa}
     */
    get boa() {
        return Boa.bind(Boa);
    },

    /**
     * An asynchronous form of setTimeout().
     * The arguments of this method can be passed in any order, or used without specifying a callback function at all.
     * Unlike boa().wait(), this method also utilizes parseTime() to handle String, Number, and BigInt time values.
     * 
     * @example
     *
     *  // Method 1:
     *  wait(() => console.log("2 seconds passed"), 2000);
     *
     *  // Method 2:
     *  wait(2000, () => console.log("2 seconds passed"));
     *
     *  // Method 3:
     *  await wait(2000);
     *  console.log("2 seconds passed");
     * 
     *  // Other time methods:
     *  await wait("2s");
     *  console.log("2 seconds passed");
     *  await wait(5n);
     *  console.log("5 minutes passed");
     * 
     * @param {Function|String|Number|BigInt} functionOrTime The function to execute, or the number of milliseconds to wait before executing.
     * @param {String|Number|BigInt|Function} [timeOrFunction] The number of milliseconds to wait before executing, or the function to execute. This will be the opposite of whichever option the previous argument is.
     * @returns 
     */
    wait(functionOrTime, timeOrFunction) {
        if (typeof functionOrTime !== 'function') functionOrTime = module.exports.parseTime(functionOrTime);
        else if (typeof timeOrFunction !== 'function') timeOrFunction = module.exports.parseTime(timeOrFunction);

        return Boa().wait(functionOrTime, timeOrFunction);
    },

    /**
     * A method that generates an Array of consecutive numbers from start to end, increasing by step.
     * @param {Number} [start] - The starting number of the array, inclusive; defaults to 0.
     * @param {Number} [end] - The ending number of the array, exclusive; if unspecified, start is used as the ending number instead.
     * @param {Number} [step = 1] - The amount to increase between each consecutive number; defaults to 1.
     * @returns {Number[]} An Array of Numbers in ascending numeric order, from start to end, increasing by step.
     */
    range(start, end, step = 1) {

        if (typeof start === 'number') {
            if (typeof end === 'number') {
                if (typeof step === 'number') {
                    return [...Array(Math.ceil((end - start) / step)).keys()].map(i => start + i * step);
                }
                else {
                    return [...Array(end - start).keys()].map(i => start + i);
                }
            }
            else {
                return [...Array(start).keys()];
            }
        }
        else if (typeof end === 'number') {
            return [...Array(end).keys()];
        }

        return [];
    },

}

/**
 * An extended Map utility class, further extending the utility functions of the Discord.js Collection class.
 */
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
        if (!maxItem) maxItem = this.find(x => f(x) == max);
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
        if (!minItem) minItem = this.find(x => f(x) == min);
        return minItem;
    }

    filter(f, thisArg, customConstructor) {
        if (thisArg) f = f.bind(thisArg);
        const result = new (customConstructor ?? Emap)();
        this.each((x, key) => f(x, key, this) && result.set(key, x));
        return result;
    }

    partition(f, thisArg) {
        return [this.filter(f, thisArg), this.filter(x => !f(x), thisArg)];
    }

    static fromObject(obj) {
        return new this(Object.entries(obj));
    }
}

/**
 * A structure representing a Stack collection (first item in = last item out).
 */
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

/**
 * A structure representing a Queue collection (first item in = first item out).
 */
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

/**
 * An extended Set utility class, further extending the utility functions of the Emap class.
 * Though an extension of Emap, this functions as both a Set and a Map in terms of retrieving and modifying values.
 */
class Eset extends Emap {
    #index = 0;

    constructor(flatIterable = []) {
        super([]);
        for (const value of flatIterable) this.add(value);
        this.eset = true;
    }

    add(item) {
        this.set("" + this.#index++, item);
    }

    filter(f, thisArg) {
        return super.filter(f, thisArg, this.constructor);
    }

    has(item) {
        return this.toArray().some(x => x == item);
    }

    toArray() {
        return [...this.sort((_, __, a, b) => Number(a) - Number(b)).values()];
    }

    toString() {
        return `Eset { [${this.toArray().join(", ")}] }`;
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
}

/**
 * An extended Map utility class, further extending the utility functions of the Emap class.
 * This functions as a Set, Map, and Array all at once in terms of retrieving and modifying values.
 */
class Edist extends Emap {

    constructor(iterable = []) {
        super(iterable);
        this.edict = true;

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (!(prop in target)) return target.get(prop);

                const getter = Reflect.get(target, prop);
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

    set(key, value, isAdding = false) {
        if (!isAdding && !this.has("NODE-ELISIF-EDIST-" + key)) {
            super.set("NODE-ELISIF-EDIST-" + key, value);
            this.add(value);
        }
        else {
            super.set(key, value);
        }

        return this;
    }

    /** @private */
    add(value) {
        return this.set("" + Math.floor(super.size / 2), value, true);
    }

    get(idOrObjectOrIndex) {
        return super.get("NODE-ELISIF-EDIST-" + idOrObjectOrIndex) ?? super.get(idOrObjectOrIndex);
    }

    filter(f, thisArg) {
        return super.filter(f, thisArg, this.constructor);
    }

    toArray() {
        return [...this.filter((_, k) => !k.startsWith("NODE-ELISIF-EDIST-")).sort((_, __, a, b) => Number(a) - Number(b)).values()];
    }

    toString() {
        return `Edist { [${this.toArray().join(", ")}] }`;
    }

    get size() {
        return Math.floor(super.size / 2);
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

/**
 * Functions the same as an Edist, but is readonly.
 * Values can only be added to this on instantiation; afterwards, values cannot be modified or added.
 */
class ReadonlyEdist extends Edist {
    constructor(iterable = []) {
        super(iterable);
    }

    set(k, v) {
        if (this.has("NODE-ELISIF-EDIST-" + k)) return console.warn("Warning: Cannot modify property values in a ReadonlyEdist");
        return super.set(k, v);
    }
}

// Globals object
module.exports.globals = new Edist();

// TODO: MAKE SEPARATE CLASS FOR BELOW STRUCTURES
module.exports.Emap = Emap;
module.exports.Estack = Estack;
module.exports.Equeue = Equeue;
module.exports.Eset = Eset;
module.exports.Edist = Edist;
module.exports.ReadonlyEdist = ReadonlyEdist;