const vm = require("vm");
class BoaFileReader extends Set {

    #lines;
    #i = 0;

    constructor(lines) {
        super(lines);
        this.#lines = lines;
    }

    /**
     * Reads the specified number of characters from the file, starting from the beginning.
     * Returns the contents of the entire file by default.
     * @param {Number} [chars] - The number of characters to read. Defaults to the length of the entire file.
     * @returns {String}
     */
    read(chars = this.#lines.join("\n").length) {
        return this.#lines.join("\n").slice(0, chars);
    }

    /**
     * Reads and returns the next line of the file. Can be used to iterate through each line of the file.
     * @returns {String}
     */
    readline() {
        return this.#lines[this.#i++];
    }

    /**
     * Reads and returns an Array of the specified number of next lines of the file.
     * Returns an Array of all lines of the file by default.
     * @param {Number} [num] - The number of following lines to read. Defaults to the number of lines in the entire file.
     * @returns 
     */
    readlines(num = this.#lines.length) {
        let lines = [];
        for (let i = 0; i < num; i++) {
            lines.push(this.readline());
        }
        return lines;
    }

    *[Symbol.iterator]() {
        for (const line of this.#lines) {
            yield line;
        }
    }

}

class BoaString extends String {
    /**
     * @returns {BoaString} This BoaString reversed.
     */
    reverse() {
        return new BoaString(this.split("").reverse().join(""));
    }
    /**
     * @returns {BoaString} This BoaString with all characters uppercased.
     */
    upper() {
        return new BoaString(this.toUpperCase());
    }
    /**
     * @returns {BoaString} This BoaString with all characters lowercased.
     */
    lower() {
        return new BoaString(this.toLowerCase());
    }
    /**
     * 
     * @returns {BoaString} This BoaString with the first character capitalized.
     */
    capitalize() {
        return new BoaString(this.slice(0, 1).toUpperCase() + this.slice(1));
    }
    /**
     * @returns {BoaString} This BoaString with all words titlecased, i.e. the first letter of each word is capitalized.
     */
    title() {
        return new BoaString(this.split(" ").map(w => new BoaString(w).capitalize()).join(" "));
    }
    /**
     * @returns {BoaString} This BoaString, split into an Array of separate lines.
     */
    splitlines() {
        return this.split("\n").map(l => new BoaString(l));
    }
    get [Symbol.toStringTag]() {
        return String(this);
    }
    [Symbol.toPrimitive](hint) {
        if (hint === "number") return Number(this);
        return String(this);
    }
}

class BoaList extends Set {

    static NULL_ITEM = Symbol("boalist_nullitem");
    static APPEND_ITEM = "[::]";
    static REGEX_APPEND = "\\[::\\]";
    
    constructor(...items) {
        super(...items);

        let getIndex = (i) => {
        return [...this.values()][i] ?? undefined;
        }

        let setIndex = (i, v) => {
        let arr = [...this.values()];
        this.clear();
        if (v != BoaList.NULL_ITEM) arr[i] = v;
        else arr.splice(i, 1);
        for (let e of arr) this.add(e);

        return true;
        }

        this.proxy = new Proxy(this, {
            get(target, prop, receiver) {
                if (prop === Symbol.iterator) return function* () {
                for (let e of this.values()) yield e;
                }.bind(target);
                if (!isNaN(prop)) return getIndex(Number(prop));
                const getter = Reflect.get(target, prop, receiver);
                return typeof getter === "function" ? getter.bind(target) : getter;
            },
            set(target, prop, value, receiver) {
                if (!isNaN(prop)) return setIndex(Number(prop), value);
                const setter = Reflect.set(target, prop, value, receiver);
                return typeof setter === "function" ? setter.bind(target) : setter;
            }
        });

        return this.proxy;
    }

    static parseElement(e) {
        let res = e;
        try {
        res = JSON.parse(e);
        }
        catch {
        if (!isNaN(res)) res = Number(res);
        else if (e == "[undefined]") res = undefined;
        else if (e == "[null]") res = null;
        else if (e == "true" || e == "false") res = Boolean(e);
        }

        return res;
    }

    values() {
        return [...super.values()].map(e => typeof e == "string" ? e?.replace(new RegExp(BoaList.REGEX_APPEND, "gm"), "") : e).map(BoaList.parseElement);
    }

    add(item = "[undefined]") {
        if (item === null) item = "[null]";
        if (typeof item !== "string") item = JSON.stringify(item);
        while (this.has(item)) item += BoaList.APPEND_ITEM;
        return super.add(item);
    }

    toArray() {
        return [...this.values()];
    }

    append(item) {
        this.add(item);
        return this;
    }

    clear() {
        super.clear();
        return this;
    }

    copy() {
        return new BoaList(...this.values());
    }

    count(v) {
        return this.toArray().filter(e => e == v).length;
    }

    extend(iterable) {
        for (let e of iterable) {
        this.add(e);
        }

        return this;
    }

    index(v) {
        return this.toArray().findIndex(e => e == v);
    }

    insert(i, v) {
        let arr = this.toArray();
        arr.splice(i, 0, v)
        this.clear();
        return this.extend(arr);
    }

    pop(i) {
        let e = this.proxy[i];
        this.proxy[i] = BoaList.NULL_ITEM;
        return e;
    }

    remove(v) {
        let i = this.index(v);
        let e = undefined;
        if (i >= 0) e = this.pop(i);
        return e;
    }

    reverse() {
        let arr = this.toArray().reverse();
        this.clear();
        return this.extend(arr);
    }

    sort({ reverse = false, key = (e) => e }) {
        let arr = this.toArray().sort((a, b) => ("" + key(a)).localeCompare("" + key(b)));
        if (reverse) arr = arr.reverse();
        this.clear();
        return this.extend(arr);
    }

    toString() {
        return `[${this.toArray().map(e => e === undefined ? "None" : (e === true ? "True" : (e === false ? "False" : JSON.stringify(e)))).join(", ")}]`;
    }
}

const { Console } = require("console");
const { Transform } = require("stream");
const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
const BOA_LOGGER = new Console({ stdout: ts })
function BoaTable(data) {
  BOA_LOGGER.table(data)
  return (ts.read() || '').toString();
}

const boa = () => {
    const GLOBALS = new Map();
    Object.keys(global).forEach(key => GLOBALS.set(key, global[key]));

    return {
        /**
         * Global variable manager for this specific instance of Boa.
         * Global variables can be directly referenced as variables within Boa's context(), promise(), use().
         * A new Globals map is generated whenever boa is called or deconstructed.
         */
        globals: GLOBALS,
        /**
         * Python-based file utility.
         * Opens a file for reading, writing, appending, creation, or deletion.
         * @param {*} filePath - The absolute path to the file to open.
         * @param {"r"|"w"|"a"|"x"|"d"|"rt"|"wt"|"at"} [action="rt"] - The action to perform on the file. "t" flag for text files. Defaults to "rt".
         * @param {"utf-8"|Object} [opts] - Options for node's fs.readFileSync, used internally by the utility.
         * @returns {BoaFileReader|BoaFileWriter|BoaFileDeleter} File reader, writer, or deleter.
         */
        open(filePath, action = "rt", opts = null) {
            const fs = require("fs");
            if (action.match("t")) opts = "utf-8";
            
            if (action.startsWith("r")) {
                const contents = fs.readFileSync(filePath, opts);

                //Read file line by line
                const gen = contents.toString().split("\n");
                return new BoaFileReader(gen);
            }
            else if (action.startsWith("w")) {
                return {
                    write(content) {
                        fs.writeFileSync(filePath, content, opts);
                    }
                };
            }
            else if (action.startsWith("a")) {
                return {
                    write(content) {
                        fs.appendFileSync(filePath, content, opts);
                    }
                };
            }
            else if (action.startsWith("x")) {
                fs.writeFileSync(filePath, "", opts);
                return this.open(filePath, "a", opts);
            }
            else if (action.startsWith("d")) {
                return {
                    remove() {
                        fs.unlinkSync(filePath);
                    }
                };
            }
            else throw new Error("Invalid file-opening action: " + action);
        },
        /**
         * Executes the provided function within the provided isolated context.
         * The function executes isolated solely to the provided context, and cannot access any variables outside of it.
         * Outside variables can be added to the context to make them accessible to the function.
         * 
         * Properties of the context (sandbox) are accessible as variables within the function.
         * These variables can be modified within the function, and this will also modify the sandbox object.
         * The sandbox object will be returned, with any modifications or additions made by the function.
         * 
         * @param {Function} f - The function to execute within a new, isolated context.
         * @param {Object} sandbox - The context to execute the function within. Properties of this object will be accessible as global variables in the function.
         * @returns {Object} The sandbox object, with any properties modified or added to it by the function.
         */
        async context(f, sandbox = {}) {
            for (let key of this.globals.keys()) {
                sandbox[key] = this.globals.get(key);
            }
            
            sandbox.boa = this;
            sandbox.console = console;
            sandbox.require = require;
            sandbox.Object = new Proxy({}, {
                get(target, prop, receiver) {
                    return Object[prop];
                }
            });
            sandbox.Array = new Proxy({}, {
                get(target, prop, receiver) {
                    return Array[prop];
                }
            });
        
            const GLOBAL_OBJECTS = "Infinity, NaN, eval, isFinite, isNaN, parseFloat, parseInt, encodeURI, encodeURIComponent, decodeURI, decodeURIComponent, Function, Boolean, Symbol, Error, AggregateError, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError, Number, BigInt, Math, Date, String, RegExp, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array, Map, Set, WeakMap, WeakSet, ArrayBuffer, SharedArrayBuffer, Atomics, DataView, JSON, Promise, Generator, GeneratorFunction, AsyncFunction, AsyncGenerator, AsyncGeneratorFunction, Reflect, Proxy, Intl, WebAssembly";
            GLOBAL_OBJECTS.split(", ").forEach(key => sandbox[key] = globalThis[key] ?? null);
        
            await vm.runInNewContext(`(${f.toString()})();`, sandbox, 'boa.vm');
        
            delete sandbox.boa;
            delete sandbox.console;
            delete sandbox.require;
            Object.keys(global).forEach(key => delete sandbox[key]);
            return sandbox;
        },
        /**
         * Executes the provided function within the provided isolated context, and
         * facilitates debugging values and variables within the context.
         * 
         * Adds the following powerful debugging methods to the context, accessible within the provided function:
         * - assert(actualValue, expectedValue, throws = false) - Asserts that actualValue is strictly equal to expectedValue.
         * - assertVariable(variableName, value, throws = false) - Like assert(), but with a string name of a context variable specified.
         * - assertType(value, expectedType, throws = false) - Like assert(), but checks the datatype of the value instead of equality.
         * - assertVariableType(variableName, expectedType, throws = false) - Like assertType(), but with a context variable.
         * - Namespace(str) - Specifies a namespace. Can be used in inspect() to name inspection groups. "CONTEXT" namespace allows inspection of context variables.
         * - inspect(...args) - Inspects and logs the given arguments. Inspection groups can be named using Namespace().
         * 
         * @param {Function} f - The function to execute within a new, isolated context.
         * @param {Object} [sandbox] - The context to execute the function within. Properties of this object will be accessible as global variables in the function.
         * @param {Object} [debuggable] - Debug options for specific variables. Key is variable name, value is "g" (log when variable used), "s" (log when variable modified), or "gs" (log when variable used or modified). Using key "*" refers to all variables, and is default if debuggable is not specified.
         * @returns {Object} The sandbox object, with any properties modified or added to it by the function, and with the added debugging utilities.
         */
        async debugContext(f, sandbox = {}, debuggable = {"*":"gs"}) {
            const originalProperties = Object.keys(sandbox);
            function originalVariables(o) {
                let res = {};
                for (let key in o) if (originalProperties.includes(key)) res[key] = o[key];
                return res;
            }
            function isObject(o) {
                return !["function", "string", "number", "boolean", "undefined"].includes(typeof o);
            }
        
            sandbox["assert"] = function(actualValue, requiredValue, throws = false) {
                let statement = actualValue === requiredValue;
                if (!statement) console.warn(`ASSERTION FAILED: ${actualValue} !== ${requiredValue}`);
                if (throws && !statement) throw new Error();
            }
        
            sandbox["assertVariable"] = function(varName, requiredValue, throws = false) {
                let actualValue = this[varName];
                return this.assert(actualValue, requiredValue, throws);
            }
        
            sandbox["assertType"] = function(actualValue, requiredType, throws = false) {
                return this.assert(typeof actualValue, requiredType, throws);
            }
        
            sandbox["assertVariableType"] = function(varName, requiredType, throws = false) {
                let actualValue = this[varName];
                return this.assertType(actualValue, requiredType, throws);
            }
        
            sandbox["Namespace"] = function(namespace) {
                return {
                    isBoaNamespace() {
                        return true;
                    },
                    value() {
                        return namespace;
                    },
                    variables() {
                        return namespace == "CONTEXT" ? [originalVariables(sandbox)] : null;
                    }
                }
            }
        
            sandbox["inspect"] = function(...args) {
                
                const namespace = args.find(a => typeof a === "object" && a?.isBoaNamespace());
                const n = namespace ? `: ${namespace.value()}` : "";
                args = args.filter(a => !(typeof a === "object" && a?.isBoaNamespace()));
                args = args.concat(namespace?.variables() ?? []);
                
                console.log(`\n┏${"-".repeat(50 + n.length)}┓\n${" ".repeat(~~((50 - 14) / 2) + 1)}Boa Inspection${n}\n`);
                for (let arg of args) {
                    if (Array.isArray(arg) || isObject(arg)) {
                        let table = BoaTable(arg);
                        for (let line of table.split("\n")) console.log(`${" ".repeat(~~((50 + n.length - line.length) / 2) + 1)}${line}`);
                    }
                    else console.log(`${" ".repeat(~~((50 + n.length - ("" + arg).length) / 2) + 1)}${arg}`);
                }
                console.log(`┗${"-".repeat(50 + n.length)}┛\n`)
            }
            
            let context = new Proxy(sandbox, {
                get(target, prop, receiver) {
        
                    if (("*" in debuggable && debuggable["*"].match("g")) || (prop in debuggable && debuggable[prop].match("g"))) {
                        console.log(`\n┏-------------------------${"-".repeat(prop.length)}┓\n  Boa Debug Context: GET ${prop}\n`);
                        if (Array.isArray(target[prop]) || isObject(target[prop])) {
                            let table = BoaTable(target[prop]);
                            for (let line of table.split("\n")) console.log(" ".repeat(~~((25 + prop.length - line.length) / 2) + 1) + line);
                        }
                        else console.log(" ".repeat(~~((25 + prop.length - ("" + target[prop]).length) / 2) + 1) + target[prop]);
                        console.log(`┗-------------------------${"-".repeat(prop.length)}┛\n`)
                    }
                    
                    const getter = Reflect.get(target, prop, receiver);
                    return typeof getter === "function" ? getter.bind(target) : getter;
                },
                set(target, prop, value, receiver) {
        
                    if (("*" in debuggable && debuggable["*"].match("s")) || (prop in debuggable && debuggable[prop].match("s"))) {
                        console.log(`\n┏-------------------------${"-".repeat(prop.length)}┓\n  Boa Debug Context: SET ${prop}\n`);
                        if (Array.isArray(value) || isObject(value)) {
                            let table = BoaTable(value);
                            for (let line of table.split("\n")) console.log(" ".repeat(~~((26 + prop.length - line.length) / 2) + 1) + line);
                        }
                        else console.log(" ".repeat(~~((26 + prop.length - value.length) / 2) + 1) + value);
                        console.log(`┗-------------------------${"-".repeat(prop.length)}┛\n`)
                    }
                    
                    const setter = Reflect.set(target, prop, value, receiver);
                    return typeof setter === "function" ? setter.bind(target) : setter;
                }
            });
        
            return this.context(f, context);
        },
        /**
         * Executes the provided function asynchronously within the provided context.
         * Promise functions `resolve()` and `reject()` are available to the function as global variables,
         * making it easy to resolve or reject the asynchronous code.
         * @param {Function} f - The function to execute asynchronously within a new, isolated context.
         * @param {Object} sandbox - The context to execute the function within. Properties of this object will be accessible as global variables in the function.
         * @returns {Promise} The promise resolved or rejected by the function.
         */
        promise(f, sandbox = {}) {
            return new Promise((resolve, reject) => {
                sandbox.resolve = resolve;
                sandbox.reject = reject;
        
                this.context(f, sandbox);
            });
        },
        /**
         * Python-based utility to return the minimum number of the provided number elements.
         * @param  {...Number} items 
         * @returns {Number}
         */
        min(...items) {
            items = items.flat(3);
            return Math.min(...items.filter(item => item !== null && !isNaN("" + item)));
        },
        /**
         * Python-based utility to return the maximum number of the provided number elements.
         * @param  {...Number} items 
         * @returns {Number}
         */
        max(...items) {
            items = items.flat(3);
            return Math.max(...items.filter(item => item !== null && !isNaN("" + item)));
        },
        /**
         * Python-based utility to return the sum of all provided number elements.
         * @param  {...Number} items 
         * @returns {Number}
         */
        sum(...items) {
            items = items.flat(3);
            return items.reduce((prev, curr) => prev + curr, 0);
        },
        /**
         * Python-based utility to reverse the order of any array, Set, or string provided.
         * The provided item is not modified; a new array/Set/string is returned.
         * Examples:
         * - [1,2,3] -> [3,2,1]
         * - "string" -> "gnirts"
         * - Set{1,2,3} -> Set{3,2,1}
         * @param {String|Set|Array} item - The string, Set, or array to reverse.
         * @returns {item}
         */
        reversed(item) {
            if (typeof item === "string") return item.split("").reverse().join("");
            if (item instanceof Set) return new Set([...item.values()].reverse());
            if (Array.isArray(item)) return item.slice().reverse();
            
            return item;
        },
        /**
         * Python-based utility to facilitate the iteration of an iterable.
         * @param {Array|String|Set} iterable - The string, Set, or array to enumerate.
         * @returns {[Number, any][]} An iterable array of the form [index, item], where item is an element of the original iterable and index is the item's index.
         */
        enumerate(iterable) {
            if (iterable instanceof Set) iterable = [...iterable.values()];
            if (typeof iterable === "string") iterable = iterable.split("");
            if (Array.isArray(iterable)) return iterable.map((e, i) => [i, e]);
            
            return iterable; 
        },
        /**
         * Python-based utility that returns an array of sequential numbers in order from start up to end.
         * If end is lower than start, an empty array is returned.
         * @param {Number} start - The start of the range, inclusive.
         * @param {Number} [end] - The end of the range, exclusive. If unspecified, start is used as the end, equivalent to range(0, start). 
         * @returns {Number[]}
         */
        range(start, end) {
            if (start === undefined) return [];
            if (end === undefined) {
                end = start;
                start = 0;
            }
            if (end < start) return [];
            return [...Array(end - start).keys()].map(i => i + start);
        },
        /**
         * Python-based utility that returns the length of any iterable.
         * Returns -1 if the provided item is not iterable or cannot be converted to an iterable.
         * @param {Array|Set|Map|String|Number} item 
         * @returns {Number}
         */
        len(item) {
            if (item === null) return -1;
            if (typeof item === 'number') item = "" + item;
            if (item.length !== undefined) return item.length;
            if (item.size !== undefined) return item.size;

            //Symbol.iterator in Object(value)

            return -1;
        },
        /**
         * Python-based utility to create a Tuple (an immutable list, or in this case an immutable array).
         * The contents of the returned array cannot be modified.
         * @param  {...any} items 
         * @returns {any[]}
         */
        tuple(...items) {
            let array = items.slice();
            array.toString = () => `(${array.join(", ")})`;
            let frozenArray = Object.freeze(array);
            return frozenArray;
        },
        /**
         * Runs the provided function in the provided context, and adds all Boa methods to the context as global variables.
         * Intended to allow using Boa utility methods as if they were actual global Python methods.
         * @param {Function} f - The function to execute within the provided context.
         * @param {Object} sandbox - The provided context
         * @returns 
         */
        use(f, sandbox = {}) {
            function binder(s,x){ if (typeof s === "function")return s.bind(x);else return s; }
            
            Object.keys(this).forEach(key => sandbox[key] = binder(this[key], this));
            return this.context(f, sandbox);
        },
        /**
         * An asynchronous form of `setTimeout()`. The arguments of this method can be passed in any order.
         * Can even be used without specifying a callback function at all.
         * 
         * @example
         * // Method 1:
         * boa.wait(() => console.log("2 seconds passed"), 2000);
         * 
         * // Method 2:
         * boa.wait(2000, () => console.log("2 seconds passed"));
         * 
         * // Method 3:
         * await boa.wait(2000);
         * console.log("2 seconds passed");
         * 
         * @param {Function|Number} f - The function to execute, or the number of milliseconds to wait before executing.
         * @param {Number|Function} ms - The number of milliseconds to wait before executing, or the function to execute. This will be the opposite of whichever option `f` is.
         * @returns {Promise<void>}
         */
        wait(f, ms) {
            if (typeof f === 'number') [ms, f] = [f, ms];
            return new Promise(resolve => setTimeout(() => resolve(f?.()), ms));
        },
        /**
         * An asynchronous form of `setInterval()`. The arguments of this method can be passed in any order.
         * 
         * @example
         * // Method 1:
         * boa.repeat(() => console.log("another 2 seconds passed"), 2000);
         * 
         * // Method 2:
         * boa.repeat(2000, () => console.log("another 2 seconds passed"));
         * 
         * @param {Function|Number} f - The function to execute, or the number of milliseconds to wait before each execution. 
         * @param {Number|Function} ms - The number of milliseconds to wait before each execution, or the function to execute. This will be the opposite of whichever option `f` is. 
         * @returns {Promise<void>}
         */
        repeat(f, ms) {
            if (typeof f === 'number') [ms, f] = [f, ms];
            let intv;
            return new Promise(resolve => {
                intv = setInterval(() => f?.(intv), ms);
                resolve(intv);
            });
        },
        /**
         * An asynchronous form of `setImmediate()`.
         * Queues execution of the callback, and runs callbacks in the order they were queued.
         * @param {Function} f - The function to execute.
         * @returns {Promise<void>}
         */
        queue(f) {
            return new Promise(resolve => setImmediate(() => resolve(f?.())));
        },
        /**
         * Python-based utility to print anything to the console.
         * All provided items are converted to strings before printing, if possible.
         * @param {...any} items - Items to print to the console. Each item will automatically be separated by a space.
         */
        print(...items) {
            return console.log(...items.map(i => i?.toString() ?? i));
        },
        /**
         * Python-based utility to get input from the console.
         * Unlike its Python equivalent, this utility method is non-blocking and asynchronous.
         * @param {String} prompt1 - The statement to display to the user in the console, prompting for input.
         * @returns {String} The user's answer to the prompt.
         */
        input(prompt1) {
            const readline = require("readline");
            const {stdin, stdout} = require("process");
            const rl = readline.createInterface({ input:stdin, output:stdout });
        
            prompt1 += " > ";
            
            return this.promise(() => rl.question(prompt1, (answer) => { rl.close(); resolve(answer); }), { prompt1, rl });
        },
        /**
         * Python-based utility that converts the provided item into a String with extra utility methods.
         * @param {*} any 
         * @returns {BoaString}
         */
        str(any) {
            return new BoaString(any);
        },
        /**
         * Python-based utility that creates a list from the provided items, with extra list-based utility methods.
         * @param  {...any} anys 
         * @returns {BoaList}
         */
        list(...anys) {
            return new BoaList(...anys);
        },
        /**
         * The python-based representation of `true`.
         * @returns {true}
         */
        True: true,
        /**
         * The python-based representation of `false`.
         * @returns {false}
         */
        False: false,
        /**
         * Python-based utility to convert the provided item to an integer.
         * Floats will be floored to the nearest integer.
         * @param {*} any 
         * @returns {Number}
         */
        int(any) {
            let i = Number(any);
            return Math.floor(i);
        },
        /**
         * Python-based utility to convert the provided item to a float.
         * @param {*} any 
         * @returns {Number}
         */
        float(any) {
            return Number(any);
        },
        /**
         * An extended event emitter, mirroring Node's EventEmitter.
         * Allows creating event listeners using named functions, with function names representing the event name.
         * Allows creating event listeners using property names beginning with "on".
         * 
         * @example
         * const emitter = boa.emitter();
         * 
         * // Classic handling:
         * emitter.on("start", () => console.log("started"));
         * 
         * // Extended function name handling:
         * emitter.on(function start() { console.log("started") });
         * 
         * // Extended property name handling:
         * emitter.onstart = () => console.log("started"); 
         *
         * // Classing emitting:
         * emitter.emit("start");
         * 
         * // Extended emitting:
         * emitter.onstart();
         * 
         * @param {*} emitter 
         * @returns 
         */
        emitter(emitter = new (require("events"))()) {
            const f = emitter.on.bind(emitter);
            emitter.on = (eventName, listener) => {
                if (typeof eventName === 'function') [eventName, listener] = [eventName.name, eventName];
                return f(eventName, listener);
            };
        
            return new Proxy(emitter, {
                get(target, prop, receiver) {
                    if (prop.startsWith("on") && !prop.endsWith("on")) return target.emit.bind(target, prop.split("on").slice(1).join("on"));
                    const getter = Reflect.get(target, prop, receiver);
                    return typeof getter === "function" ? getter.bind(target) : getter;
                },
                set(target, prop, value, receiver) {
                    if (prop.startsWith("on") && !prop.endsWith("on")) return f(prop.split("on").slice(1).join("on"), value);
                    const setter = Reflect.set(target, prop, value, receiver);
                    return typeof setter === "function" ? setter.bind(target) : setter;
                }
            });
        },
        /**
         * Python-based utility to create an extended Dictionary from a JS Object or Map.
         * 
         * @example
         * const dict = boa.dict({ a: 1, b: 2 });
         * 
         * // Setting values method 1:
         * dict.set('a', 3);
         * 
         * // Setting values method 2:
         * dict.a = 3;
         * 
         * // Getting values method 1:
         * dict.get('a'); // => 3
         * dict.get('b'); // => 2
         * 
         * // Getting values method 2:
         * dict.a; // => 3
         * dict.b; // => 2
         * 
         * @param {Object|Map} obj 
         * @returns {ProxiedMap}
         */
        dict(obj = {}) {
            const map = obj instanceof Map ? obj : new Map(Object.keys(obj).map(k => [k, obj[k]]));
            
            return new Proxy(map, {
                get(target, prop, receiver) {
                    if (!(prop in map)) return map.get(prop);
                    const getter = Reflect.get(target, prop, receiver);
                    return typeof getter === "function" ? getter.bind(target) : getter;
                },
                set(target, prop, value, receiver) {
                    if (!(prop in map)) return map.set(prop, value);
                    const setter = Reflect.set(target, prop, value, receiver);
                    return typeof setter === "function" ? setter.bind(target) : setter;
                }
            });
        },
        /**
         * Inspects the given items in the console.
         * Arrays and Objects will be displayed as a console table. All other items will be displayed as a regular console log.
         * @param  {...any} args 
         */
        inspect(...args) {
            function isObjOrArr(arg, k) {
                return (Array.isArray(arg) || !["function", "string", "number", "boolean", "undefined"].includes(typeof arg)) && !(k == "global")
            }
            for (let arg of args) {
                if (isObjOrArr(arg)) console.log(BoaTable(Object.fromEntries(Object.entries(arg).map(([k, v]) => [k, (isObjOrArr(v, k) ? JSON.stringify(v) : v.toString()).slice(0, 30) + ((isObjOrArr(v, k) ? JSON.stringify(v) : v.toString()).length > 30 ? " ..." : "")]))));
                else console.log(arg);
            }
        },
        /**
         * Inspects the datatypes of the given items in the console.
         * Arrays and Objects will be displayed as a console table. All other items will be displayed as a regular console log.
         * @param  {...any} args 
         */
        inspectTypes(...args) {
            const self = this;
            function isObjOrArr(arg, k) {
                return (Array.isArray(arg) || self.isObject(arg)) && !(k == "global")
            }
            function type(a) {
                if (Array.isArray(a)) return "array";
                else if (a && typeof a === "object" && a.constructor && a.constructor.name !== "Function" && a.constructor.name !== "Object") return a.constructor.name;
                
                else if (typeof a === "function" && a.prototype && (Object.getOwnPropertyNames(a.prototype).length > 1 || Function.prototype !== Object.getPrototypeOf(a))) return "class";
                return typeof a;
            }
            args = args.map(a => isObjOrArr(a) ? Object.fromEntries(Object.entries(a).map(([k,v]) => [k, type(v)])) : type(a));
            return this.inspect(...args);
        },
        /** 
         * @returns {String} A table representation of the provided object or array.
         */
        table(obj) {
            return BoaTable(obj);
        },
        /**
         * @param {*} any - Item to convert to String.
         * @param {Number} chars - Number of characters of the converted String to return. Ellipses are added if the String is cut off.
         * @returns {String|null} String representation of the provided item, if possible. 
         */
        stringify(any, chars) {
            let res;

            if (typeof any === 'function' && any.name) return any.name;

            try {
                res = JSON.stringify(any);
            }
            catch {
                try {
                    res = any?.toString();
                }
                catch {
                    res = null;
                }
            }

            if (res === null && any && Array.isArray(any)) res = "[object Array]";
            else if (res === null && any && typeof any === 'object') res = "[object Object]";

            if (res && typeof res === 'string' && chars) res = res.substring(0, chars) + (res.length <= chars ? "" : " ...");
            return res;
        },
        /**
         * Determines whether the given item is an actual Object, i.e. a non-primitive, non-null, non-function Object instance.
         * @param {*} arg 
         * @returns {Boolean} Whether the given item is an actual Object.
         */
        isObject(arg) {
            return !["function", "string", "number", "boolean", "undefined"].includes(typeof arg) && arg !== null;
        }
    };
}

module.exports = boa;