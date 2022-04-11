const ExtendedStructure = require('./ExtendedStructure');

module.exports = class SendableComponentFactory extends ExtendedStructure {

    #factory = {};
    constructor(factoryMethods = {}, baseFactory = {}) {
        super(null, baseFactory, factoryMethods)
        this.#factory = factoryMethods;
        this.id = SendableComponentFactory.generateId();
    }

    toJSON() {
        return (this.#factory.toJSON ?? console.warn)("toJSON() is not implemented for this SendableComponentFactory.");
    }

    onSend(parentMessage) {
        return this.#factory.onSend ? this.#factory.onSend(parentMessage) : console.warn("onSend() is not implemented for this SendableComponentFactory.");
    }

    static PREVIOUS_ID_NUMBER = 0;
    static generateId() {
        return ((++SendableComponentFactory.PREVIOUS_ID_NUMBER) + "sendableComponent").substring(0, 18);
    }

}