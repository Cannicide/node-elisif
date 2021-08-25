
class ExpansionManager {

    constructor(expansions) {
        this.expansions = expansions.enable;
        this.expansion_settings = expansions;
    }

    all() {
        return this.expansions;
    }

    has(expansion) {
        return this.all().includes(expansion);
    }

    get(expansion) {
        if (!expansion) return this.all();
        else if (this.has(expansion)) return require(`../expansions/${expansion}`);
        else return false;
    }

    settings(expansion) {
        return this.expansion_settings[expansion] ?? {};
    }
}

module.exports = ExpansionManager;