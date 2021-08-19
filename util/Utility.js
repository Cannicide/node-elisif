
const MessageUtility = require('./MessageUtility');
const GuildMemberUtility = require('./GuildMemberUtility');
const StructureUtility = require('./StructureUtility');
const { Intents, Permissions } = require('discord.js');

class Utility {

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
            return "isContentSupplier" in supplier && supplier.isContentSupplier();
        }

        static asEmbedsIfSupplier(supplier) {
            if (MessageContentSupplier.is(supplier)) {
                let contentData = supplier.thisAsEmbeds();
                if (supplier.content) contentData.content = supplier.content;
                return contentData;
            }
            return supplier;
        }

    }

    ElisifSet = class ElisifSet extends Set {
        constructor(values) {
            super();
            values.forEach(val => this.add(val));
        }

        toArray() {
            return [...this.values()];
        }

        map(func) {
            return this.toArray().map(func);
        }

        get(index) {
            return this.toArray()[index];
        }
    }

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
            var resolve = () => false, reject = () => false;
            this.manyThen = (res) => {
                resolve = res;
                return this;
            };
            this.manyCatch = (rej) => reject = rej;

            promise().then((value) => setTimeout(() => resRejMethod(value, resolve, reject), 500));
        }
    }

    //Structure Utility Methods:

    Structure = StructureUtility;

    message(message) {
        return this.Structure.get(message.id) ?? new MessageUtility(message, this);
    }

    member(member) {
        return this.Structure.get(member.id) ?? new GuildMemberUtility(member, this);
    }

}

//Intentionally uses constructed object instead of static class, for documentation purposes
module.exports = new Utility();