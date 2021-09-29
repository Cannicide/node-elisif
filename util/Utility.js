
const MessageUtility = require('./MessageUtility');
const TextChannelUtility = require('./TextChannelUtility');
const GuildMemberUtility = require('./GuildMemberUtility');
const GuildUtility = require('./GuildUtility');
const { ButtonUtility, SelectUtility, ComponentUtility } = require('./ComponentUtility');
const SlashUtility = require('./SlashUtility');
const StructureUtility = require('./StructureUtility');
const { Intents, Permissions } = require('discord.js');
const { ElisifSet, ElisifMap } = require("./CollectionUtility");
const Random = require("./RandomUtility");

class Utility {
    
    get util() {
        return this;
    }

    /**
     * @param {string} str
     * @returns {string}
     */
    escapeString(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    getIntentsAsArray() {
        return [
            "GUILDS",
            "GUILD_BANS",
            "GUILD_VOICE_STATES",
            "GUILD_MESSAGES",
            "GUILD_MESSAGE_REACTIONS",
            "GUILD_MESSAGE_TYPING",
            "DIRECT_MESSAGES"
        ];
    }

    getPrivilegedIntentsAsArray() {
        return [
            "GUILD_MEMBERS",
            "GUILD_PRESENCES"
        ];
    }

    getAllIntentsAsArray() {
        const allIntents = this.getIntentsAsArray();
        return allIntents.concat(this.getPrivilegedIntentsAsArray());
    }

    getIntentEnums() {
        return this.intentsToEnums(this.getIntentsAsArray());
    }

    getPrivilegedIntentEnums() {
        return this.intentsToEnums(this.getPrivilegedIntentsAsArray());
    }

    getAllIntentEnums() {
        return this.intentsToEnums(this.getAllIntentsAsArray());
    }

    intentToEnum(intent) {
        return Intents.FLAGS[intent];
    }

    intentsToEnums(intents) {
        return intents.map(intent => this.intentToEnum(intent));
    }

    permToEnum(perm) {
        return Permissions.FLAGS[perm];
    }

    permsToEnums(perms) {
        return perms.map(perm => this.permToEnum(perm));
    }

    bindNth(self, fn, ...bound_args) {
        return function (...args) {
            return fn.call(self, ...args, ...bound_args);
        };
    }

    /** 
     * Makes an existing Message object sendable, for example to make it possible to edit a message with a modified version of itself.
    */
    makeSendable(message) {
        if (message.content == "") message.content = undefined;
        return message;
    }

    //Custom utility classes:

    /**
     * Used to provide message content and embed data, mostly used internally by interfaces.
    */
    ContentSupplier = class MessageContentSupplier {
        constructor(origin, contentData = {}) {

            this.content = undefined;
            this.embeds = undefined;

            Object.keys(contentData).forEach(key => {

                this[key] = contentData[key];
          
            });

            this.origin = origin;
            this.isContentSupplier = () => true;
        }

        thisAsEmbeds() {
            return {embeds: [this]};
        }

        static is(supplier) {
            return typeof supplier != "string" && "isContentSupplier" in supplier && supplier.isContentSupplier();
        }

        static asEmbedsIfSupplier(supplier) {
            if (MessageContentSupplier.is(supplier) && supplier.origin == "embedContext") {
                let contentData = supplier.thisAsEmbeds();
                if (supplier.content) contentData.content = supplier.content;
                return contentData;
            }
            return supplier;
        }

    }

    ElisifSet = ElisifSet;
    ElisifMap = ElisifMap;
    Random = new Random(this);

    /**
     * Mr. Promise, aka MultiResolvePromise, is similar to a regular Promise but can resolve and reject more than once.
     * Unlike proper Promises, the MultiResolvePromise only has `.manyThen()` and `.manyCatch()` methods, and each can only be used once (cannot be chained).
     * 
     * Note: MultiResolvePromises do NOT extend actual Promises. As such, they do not work like Promises with async/await.
     * 
     */
    MRPromise = class MultiResolvePromise {
        /**
         * @param {() => Promise<any>} promise - A method that returns a promise. Can be async. The MultiResolvePromise will wait for this promise to resolve and then allow the output of the promise to be used when resolving/rejecting.
         * @param {(value: any, resolve: (...args) => void, reject: (...args) => void) => void} resRejMethod - A method that contains the resolved output of the `promise` function, a function to resolve the MRPromise, and a function to reject the MRPromise.
         */
        constructor(promise, resRejMethod) {
            var resolve = () => false, reject = () => false, promiseResolve = () => false;
            this.manyThen = (res) => {
                resolve = res;
                return this;
            };
            this.manyCatch = (rej) => reject = rej;
            this.promiseResolve = (prRes) => promiseResolve = prRes;

            promise().then((value) => {
                promiseResolve(value);
                setTimeout(() => resRejMethod(value, resolve, reject), 500)
            });
        }
    }

    /**
     * An iterable Generator class that simplifies and extends the functionality of (function*) generator functions.
     * Can be properly iterated by `for-of` loops, just like generator functions.
    */
    Generator = class Generator {

        iterator;
        prev = null;
        
        constructor(iterator, ...vals) {
            this.iterator = iterator(...vals);
        }
        
        next() {
            this.prev = this.iterator.next().value;
            return this.prev;
        }

        hasNext() {
            return !this.prev?.done;
        }

        current() {
            return this.prev;
        }
        
        *[Symbol.iterator]() {
            yield* this.iterator;
        }
        
    }

    //Structure Utility Methods:

    Structure = StructureUtility;
    Button = ButtonUtility;
    SelectMenu = SelectUtility;

    Message(message) {

        if (!(message instanceof require("discord.js").Message)) return this.Slash(message);

        message.util = new MessageUtility(message, this);
        return message.util;
    }

    Member(member) {
        member.util = new GuildMemberUtility(member, this);
        return member.util;
    }

    Channel(channel, message = null) {
        channel.util = new TextChannelUtility(channel, this, message);
        return channel.util;
    }

    Guild(guild) {
        guild.util = new GuildUtility(guild, this);
        return guild.util;
    }

    Component(component, message = null) {
        component.util = ComponentUtility.fromInteraction(component, this, message);
        return component.util;
    }

    Slash(interaction) {
        interaction.util = new SlashUtility(interaction, this);
        return interaction.util;
    }

    /**
     * Gets a StructureUtility from the StructureUtility cache by ID.
    */
    cache(id) {
        return this.Structure.get(id);
    }

}

//Intentionally uses constructed object instead of static class, for documentation purposes
module.exports = new Utility();