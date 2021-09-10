
module.exports = class RandomUtility {

    util;

    /**
     * @param {import("./Utility")} util
    */
    constructor(util) {
        this.util = util;
    }

    num(minimum, maximum) {
          
        return new this.util.Generator(function* (min, max) {
            let power;
            
            while (true) {
                power = Math.floor(Math.random() * (max - min + 1)) + min;
                yield power;
            }
        }, minimum, maximum);

    }

    unique(minimum, maximum) {

        return new this.util.Generator(function* (min, max) {
            let prev = min - 1;
            let power;
            
            while (true) {
                let i = 0;
                do {
                    power = Math.floor(Math.random() * (max - min + 1)) + min;
                    i++;
                }
                while (power == prev || i == 0);
                
                prev = power;
                yield power;
            }
        }, minimum, maximum);

    }

}