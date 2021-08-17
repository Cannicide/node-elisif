
const MessageUtility = require('./MessageUtility');

class Utility {

    /**
     * @param {string} str
     * @returns {string}
     */
    static escapeString(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    static message(message) {
        return new MessageUtility(message);
    }

}

module.exports = Utility;