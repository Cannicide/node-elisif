const { Sifbase } = require('sifbase');

module.exports = {
    BaseSettings: class BaseSettings {

        constructor(databasePath, locale) {
            this.db = new Sifbase(databasePath).table("settings");
            this.locale = locale;
        }

        async clear() {
            return await this.db.delete(this.locale);
        }

        async delete(key) {
            const output = await this.prepare();
            delete output[key];
            return await this.db.set(this.locale, output);
        }

        async set(key, value) {
            const output = await this.prepare();
            output[key] = value;
            return await this.db.set(this.locale, output);
        }

        async get(key) {
            return (await this.prepare())[key];
        }

        async has(key) {
            const output = await this.prepare();
            return key in output;
        }

        get cache() {
            return BaseSettings.toMap(this.db.cache.get(this.locale));
        }

        /** @private */
        static toMap(objectLiteral) {
            let map = new Map();
            for (let key in objectLiteral) {
                map.set(key, objectLiteral[key]);
            }
            return map;
        }

        /** @private */
        async prepare() {
            let output = await this.db.get(this.locale);
            if (!output) await this.db.set(this.locale, {});
            return output ?? {};
        }

    }
}