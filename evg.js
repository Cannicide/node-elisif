//The Evergreen (EvG) 3.0 data storage system

//Third-generation, vastly improved utility for easily storing, accessing, and manipulating data in a JS Object structure.
//SQLite database via quick.db allows for easier, faster, and more efficient data manipulation while reducing system storage and RAM usage.

//   Created by Cannicide#2753

//Inspired by the storage system of Evergreen (EvG 1.0), Cannicide's music service
//Mostly backwards-compatible with EvG 2.0
//Zero compatibility with EvG 1.0 (LSON) and EvG-Beta (SimplerLS)

const fs = require("fs");
const db = require("quick.db");

/**
 * The legacy EvG 2.0-based storage system.
 * @param {String} filename - The name of the JSON storage file
 * @param {boolean} [isTable] - Whether or not the filename is a path to a database table
 * @param {boolean} [ignoreErrors] - If true, does not send error message. Used for JSON importation in EvG 3.0.
 */
function LegacyEvg(filename, isTable, ignoreErrors) {

    var storageSrc = __dirname + "/storage/" + filename + ".json";

    function getLS() {

      var storage;

      if (isTable) {
        storage = filename == "" ? db.all() : db.get(filename);
      }
      else {
        if (!fs.existsSync(storageSrc)) return false;

        try {
            //Gets json file, and converts into JS object
            storage = JSON.parse(fs.readFileSync(storageSrc));
        }
        catch (err) {
            if (!ignoreErrors) console.log("Reading JSON was not possible due to error: " + err);
            return false;
        }
      }

        //Returns the storage object
        return storage;
    }

    function setLS(newStorage) {

      if (isTable) {
        db.set(filename, newStorage);
      }
      else {
        //Updates json file with new config additions/updates
        fs.writeFileSync(storageSrc, JSON.stringify(newStorage, null, "\t"));
      }

    }

    this.get = getLS;

    this.set = setLS;

    /**
     * Edit and update storage data. The specified function must return the modified data in order to update the storage.
     * @param {Function(Object)} func - Function used to edit storage data.
     */
    this.edit = (func) => {
      var storage = getLS();

      var output = func(storage);

      if (output) setLS(output);
      else console.warn("Failed to update the storage, because no output was provided when using the LegacyEvg.edit() method.");
    }

    if (isTable) {
      this.toModern = () => new Evg(filename);
    }

}

function Evg(tablePath, parentPath) {

  parentPath = parentPath || "";
  if (parentPath != "") parentPath += ".";

  var fullPath = parentPath + tablePath;

  var table = db;

  this.get = (key) => {
    if (!key) return this.all();

    return table.get(`${fullPath}.${key}`);

  }

  /**
   * Returns a new EvG object containing the db table/sub-table at the specified key.
   */
  this.table = (key) => {
    if (!key) return this.all();

    return new Evg(key, fullPath);
  }

  this.all = () => {
    var arr = db.get(fullPath);

    if (arr && typeof arr === "object" && !Array.isArray(arr)) {
      var inc = [];
      Object.keys(arr).forEach(item => inc.push({key: item, value: arr[item]}));

      arr = inc;
    }
    else if (Array.isArray(arr)) arr = arr;
    else arr = [];

    return arr;
  }

  this.values = () => {
    var arr = db.get(fullPath);

    if (arr && typeof arr === "object" && !Array.isArray(arr)) {
      arr = Object.values(arr);
    }
    else if (Array.isArray(arr)) arr = arr;
    else arr = [];

    return arr;
  }

  this.find = (func) => this.values().find(func);

  this.filter = (func) => this.values().filter(func);

  this.set = (key, value) => {

    table.set(`${fullPath}.${key}`, value);

    return this;

  }

  this.add = (key, amount) => {

    table.add(`${fullPath}.${key}`, amount);

    return this;

  }

  this.subtract = (key, amount) => {

    table.subtract(`${fullPath}.${key}`, amount);

    return this;

  }

  this.has = (key) => {
    return table.has(`${fullPath}.${key}`);
  }

  this.remove = (key) => {
    table.delete(`${fullPath}.${key}`);

    return this;
  }

  this.splice = (index) => {
    var arr = this.values();
    arr.splice(index, 1);

    table.set(fullPath, arr);
    return this;
  }

  this.push = (key, value) => {
    if (!key) return console.error("No key was specified at Evg.push()");

    var path = `${fullPath}.${key}`;
    if (!value) {
      value = key;
      path = `${fullPath}`;
    }

    table.push(path, value);
    return this;

  }

  /**
   * The full database object (root table).
   */
  this.root = () => db;

  /**
   * The parent database table (original tablePath).
   */
  this.parent = () => new Evg(parentPath.split(".")[0]);

  /**
   * Converts to LegacyEvg object (more backwards compatible with EvG 
   * 2.0).
   */
  this.toLegacy = () => new LegacyEvg(fullPath, true);

  /**
   * Returns the full path to the current db table.
   */
  this.fullTablePath = () => fullPath;

  /**
   * Clears the entirety of the current db table.
   */
  this.clear = () => {
    db.delete(fullPath);
  }

  /**
   * Import data from a JSON file and insert it into the database. 
   * Allows for importing EvG 2.0 data into EvG 3.0 storage. Any data 
   * already in the EvG object storage is not replaced; only 
   * insertions occur. Supports both objects and arrays stored in 
   * JSON files.
   * 
   * @param {String} filename - Name of the JSON file
   * @param {boolean} [del] - Delete the JSON file after importing (one-time import)
   */
  this.importJSON = (filename, del) => {
    var filepath = __dirname + "/storage/" + filename + ".json";
    if (!fs.existsSync(filepath)) return this;
    
    var legacy = new LegacyEvg(filename, false, false);
    var json = legacy.get();

    if (typeof json === "object" && !Array.isArray(json)) {
      Object.keys(json).forEach(key => !this.has(key) ? this.set(key, json[key]) : "");
    }
    else if (Array.isArray(json)) {
      json.forEach(item => !this.find(val => val == item) ? this.push(item) : "");
    }

    if (del && fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      }
      catch (err) {
        //File already deleted.
        //Catch the error
        console.log("An error occurred when deleting a JSON file.");
      }
    }

    return this;
  }

}

/**
 * Synchronously returns a Legacy EvG 2.0 storage object, with JSON or database storage support.
 * @param {String} filename - Name of the JSON file or database storage.
 * @param {boolean} legacy - Whether or not to use the legacy JSON storage system instead of database storage.
 */
function InverseLegacyEvg(filename, legacy) {
  return new LegacyEvg(filename, !legacy)
}

module.exports = {
  /**
   * Directly, synchronously returns an EvG 3.0 storage object.
   */
  resolve: (filename) => new Evg(filename),
  /**
   * Asynchronously retrieves an EvG 3.0 storage object.
   */
  from: (filename, callback) => {
    if (callback) return callback(new Evg(filename));

    return new Promise((resolve, reject) => {resolve(new Evg(filename))})
  },
  cache: InverseLegacyEvg,
  /**
   * Synchronously returns an EvG 3.0 storage object, and automatically imports the data of a specified JSON storage into the EvG 3.0 database storage. The old JSON storage is deleted afterwards.
   * @param {String} filename - The name of the database storage.
   * @param {String} [optionalJSONfilename] - The name of the JSON file. If unspecified, the value of `filename` is used instead.
   */
  remodel: (filename, optionalJSONfilename) => {
    optionalJSONfilename = optionalJSONfilename || filename;

    return new Evg(filename).importJSON(optionalJSONfilename, "delete");
  }
};