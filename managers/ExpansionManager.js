
class ExpansionManager {

    constructor(enabledExpansions) {
        this.expansions = enabledExpansions;
    }

    all() {
        return this.expansions
    }

    has(expansion) {
        return this.all().includes(expansion)
    }

    get(expansion) {
        if (!expansion) return this.all();
        else if (this.has(expansion)) return require(`../expansions/${expansion}`);
        else return false;
    }
}

module.exports = ExpansionManager;