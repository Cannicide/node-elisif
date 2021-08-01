//The Evergreen (EvG) 4.0 data storage system

//Fourth-generation, vastly improved utility for easily storing, accessing, and manipulating data in a JS Object structure.
//Now equipped with more powerful methods of interacting with EvG 2.0-type JSON storage and EvG 3.0-type SQLITE3 storage, replacing the highly limited EvG 2.0 legacy methods.

//   Created by Cannicide#2753

//Inspired by the EvG 1.0 storage system of Evergreen, Cannicide's music service
//Fully backwards-compatible with EvG 3.0.
//Slightly backwards-compatible with EvG 2.0; legacy methods have been removed and replaced with more modern and useful utility methods.
//Zero compatibility with EvG 1.0 (LSON) and EvG-Beta (SimplerLS)

const fs = require("fs");
var dbUsable = true;
var db = false;

try {
  db = require("quick.db");
}
catch (e) {
  dbUsable = false;
}

/**
 * The legacy EvG 2.0-based storage system.
 * Used to interact with EvG 2.0 structures, but now utilizes modern utility methods adapted from EvG 3.0 structures.
 * @param {String} filename - The name of the JSON storage file
 * @param {String} tabledPath - The path to the object currently being interacted with by the LegacyEvG methods. When undefined or false, the contents of the full file are being interacted with in the current table.
 */
function LegacyEvg(filename, tabledPath) {

    var storageSrc = __dirname + "/storage/" + filename + ".json";

    function getLS() {

      var storage;

        if (!fs.existsSync(storageSrc)) {
          // return false;
          fs.writeFileSync(storageSrc, JSON.stringify({}));
        }

        try {
            //Gets json file, and converts into JS object
            storage = JSON.parse(fs.readFileSync(storageSrc));
        }
        catch (err) {
            console.log("Reading JSON was not possible due to error: " + err);
            return false;
        }

        //Returns the storage object
        return storage;
    }

    function setLS(newStorage) {

        //Updates json file with new config additions/updates
        fs.writeFileSync(storageSrc, JSON.stringify(newStorage, null, "\t"));

    }

    function getTable(path) {
      var tabledObj = getLS();

      if (path && !Array.isArray(tabledObj)) {
        var segments = path.split(".");

        segments.forEach(item => {

          if (tabledObj && item in tabledObj) tabledObj = tabledObj[item];
          else tabledObj = null;

        });

      }

      return tabledObj;

    }

    function setTable(newTabledObj) {
      var tabledObj = getLS();

      if (tabledPath && !Array.isArray(tabledObj)) {
        var segments = tabledPath.split(".");
        
        function setValueAtPath() {
          var i, parent = tabledObj;
          for (i = 0; i < segments.length - 1; i++) {
            if (parent && segments[i] in parent) parent = parent[segments[i]];
            else parent = null;
          }

          if (parent) {
            parent[segments[i]] = newTabledObj;
            return true;
          }
          else return false;
        }

        var result = setValueAtPath();
        if (result) setLS(tabledObj);

        return result;

      }
      else {
        setLS(newTabledObj);
        return true;
      }

    }

    function deleteTable() {
      var tabledObj = getLS();

      if (tabledPath && !Array.isArray(tabledObj)) {
        var segments = tabledPath.split(".");
        
        function delValueAtPath() {
          var i, parent = tabledObj;
          for (i = 0; i < segments.length - 1; i++) {
            if (parent && segments[i] in parent) parent = parent[segments[i]];
            else parent = null;
          }

          if (parent) {
            delete parent[segments[i]];
            return true;
          }
          else return false;
        }

        var result = delValueAtPath();
        if (result) setLS(tabledObj);

        return result;

      }
      else {
        setLS(Array.isArray(tabledObj) ? [] : {});
        return true;
      }

    }

    this.get = (key) => {
      var ls = getTable(tabledPath);
      
      if (!key) return this.all();

      if (!key.match("\\.")) return ls[key];
      else {
        var segments = key.split(".");
        var trueKey = segments.pop();

        var table = this.table(segments.join("."));
        if (table) return table.get(trueKey);
        else return null;
      }

    };

    this.all = () => {
      var arr = getTable(tabledPath);

      if (arr && typeof arr === "object" && !Array.isArray(arr)) {
        var inc = [];
        Object.keys(arr).forEach(item => inc.push({key: item, value: arr[item]}));

        arr = inc;
      }
      else if (Array.isArray(arr)) arr = arr;
      else arr = [];

      return arr;
    }

    this.objectify = () => {
      var all = this.all();

      var isObject = false;

      if (all.some(v => typeof v === "object" && !Array.isArray(v) && "key" in v && "value" in v)) isObject = true;

      if (isObject) {
        //this.all() represents an Object, but is in Object[] form

        all.unshift({});

        var obj = all.reduce((acc, val) => {
          acc[val.key] = val.value;
          return acc;
        });

        return obj;

      }
      else {
        //this.all() represents a basic Array

        return all;
      }

    }

    this.set = (key, value) => {
      if (!key.match("\\.")) {
        var ls = getTable(tabledPath);

        ls[key] = value;
        setTable(ls);
      }
      else {
        var segments = key.split(".");
        var trueKey = segments.pop();

        var table = this.table(segments.join("."));
        if (table) table.set(trueKey, value);
      }

      return this;

    };

    this.table = (key) => {
      if (!key) return this.all();

      var newPath = tabledPath;

      if (!newPath) newPath = key;
      else newPath += "." + key;

      if (!getTable(newPath)) {
        this.set(key, {});
        return null;
      }

      return new LegacyEvg(filename, newPath);
    }

    this.values = () => {
      var arr = getTable(tabledPath);

      if (arr && typeof arr === "object" && !Array.isArray(arr)) {
        arr = Object.values(arr);
      }
      else if (Array.isArray(arr)) arr = arr;
      else arr = [];

      return arr;
    }

    this.keys = () => this.all().map(item => item.key);

    this.find = (func) => this.values().find(func);

    this.findKey = (value) => this.keys().find(key => value in this.get(key));

    this.filter = (func) => this.values().filter(func);

    this.add = (key, amount) => {

      if (!this.has(key)) this.set(key, 0);

      this.set(key, this.get(key) + amount);
      return this;

    }

    this.subtract = (key, amount) => {

      if (!this.has(key)) this.set(key, 0);

      this.set(key, this.get(key) - amount);
      return this;

    }

    this.has = (key) => {
      return this.get(key) != undefined && this.get(key) != null ? true : false;
    }

    this.remove = (key) => {
      
      var ls = getTable(tabledPath);

      if (!key.match("\\.")) {
        delete ls[key];
        setTable(ls);
      }
      else {
        var segments = key.split(".");
        var trueKey = segments.pop();

        var table = this.table(segments.join("."));
        if (table) table.remove(trueKey);
      }

      return this;

    }

    this.splice = (index) => {
      var arr = this.values();
      arr.splice(index, 1);

      setTable(arr);
      return this;
    }

    this.push = (value) => {
      if (!value) return console.error("No value was specified at LegacyEvg.push()");

      var arr = this.values();
      arr.push(value);

      setTable(arr);
      return this;

    }

    /**
     * The root database table (original tablePath).
     */
    this.root = () => new LegacyEvg(filename);

    /**
     * Returns the full path to the current db table.
     */
    this.fullTablePath = () => tabledPath;

    /**
     * Clears the entirety of the current db table.
     */
    this.clear = () => {
      return deleteTable();
    }

    /**
     * Exports the current root database table as a JSON file, saved to a location of your choice.
     */
    this.exportAsJSON = (filepath) => {

      var output = this.objectify();

      fs.writeFileSync(filepath, JSON.stringify(output, null, "\t"));

    }

    /**
   * Import data from a JSON file and insert it into the database. 
   * Allows for importing EvG 2.0 JSON data into EvG 4.0 storage. Any data 
   * already in the EvG object storage is not replaced; only 
   * insertions occur. Supports both objects and arrays stored in 
   * JSON files.
   * 
   * @param {String} filepath - Path to the JSON file
   * @param {boolean} [del] - Delete the JSON file after importing (one-time import)
   */
  this.importJSON = (filepath, del) => {
    if (!fs.existsSync(filepath)) return this;
    
    var json = JSON.parse(fs.readFileSync(filepath));

    if (typeof json === "object" && !Array.isArray(json)) {
      Object.keys(json).forEach(key => !this.has(key) ? this.set(key, json[key]) : "");
    }
    else if (Array.isArray(json)) {
      json.forEach(item => !this.find(val => val == item) ? this.push(item) : "");
    }

    //Check if file at filepath exists again, to be safe
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
 * The modern EvG 3.0 and 4.0-based storage system.
 * Used to interact with an SQLITE database.
 * @param {String} tablePath - The name of or path to the table in the database currently being interacted with by the EvG methods.
 * @param {String} parentPath - The full table path, excluding tablePath, leading up to the current database table.
 */
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

    if (!this.has(key)) this.set(key, {});

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

  this.objectify = () => {
    var all = this.all();

    var isObject = false;

    if (all.some(v => typeof v === "object" && !Array.isArray(v) && "key" in v && "value" in v)) isObject = true;

    if (isObject) {
      //this.all() represents an Object, but is in Object[] form

      all.unshift({});

      var obj = all.reduce((acc, val) => {
        acc[val.key] = val.value;
        return acc;
      });

      return obj;

    }
    else {
      //this.all() represents a basic Array

      return all;
    }

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

  this.keys = () => this.all().map(item => item.key);

  this.find = (func) => this.values().find(func);

  this.findKey = (value) => this.keys().find(key => value in this.get(key));

  this.filter = (func) => this.values().filter(func);

  this.set = (key, value) => {

    table.set(`${fullPath}.${key}`, value);

    return this;

  }

  this.add = (key, amount) => {

    if (!this.has(key)) this.set(key, 0);
    table.add(`${fullPath}.${key}`, amount);

    return this;

  }

  this.subtract = (key, amount) => {

    if (!this.has(key)) this.set(key, 0);
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
  this.sqlite = () => db;

  /**
   * The parent database table (original tablePath).
   */
  this.root = () => new Evg(parentPath.split(".")[0]);

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
   * Allows for importing EvG 2.0 JSON data into EvG 4.0 storage. Any data 
   * already in the EvG object storage is not replaced; only 
   * insertions occur. Supports both objects and arrays stored in 
   * JSON files.
   * 
   * @param {String} filepath - Path to the JSON file
   * @param {boolean} [del] - Delete the JSON file after importing (one-time import)
   */
  this.importJSON = (filepath, del) => {
    if (!fs.existsSync(filepath)) return this;
    
    var json = JSON.parse(fs.readFileSync(filepath));

    if (typeof json === "object" && !Array.isArray(json)) {
      Object.keys(json).forEach(key => !this.has(key) ? this.set(key, json[key]) : "");
    }
    else if (Array.isArray(json)) {
      json.forEach(item => !this.find(val => val == item) ? this.push(item) : "");
    }

    //Check if file at filepath exists again, to be safe
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

  /**
   * Exports the current root database table as a JSON file, saved to a location of your choice.
   */
  this.exportAsJSON = (filepath) => {

    var output = this.objectify();

    fs.writeFileSync(filepath, JSON.stringify(output, null, "\t"));

  }

}

/**
 * A simple wrapper for constructing EvG objects that checks to make sure the database module exists before utilizing non-legacy EvG.
 */
function EvgDBCWrapper(filename, method) {

  try {
    db;
  }
  catch (e) {
    dbUsable = false;
  }

  if (!dbUsable) {
    throw new Error(`Unable to construct EvG Object: the database module quick.db has not been installed. To proceed using JSON instead of an SQLITE database, please use the .cache() method instead of the .${method}() method.`);
  }

  return new Evg(filename);

}

module.exports = {
  /**
   * Directly, synchronously returns an EvG 3.0 storage object.
   */
  resolve: (filename) => EvgDBCWrapper(filename, "resolve"),
  /**
   * Asynchronously retrieves an EvG 3.0 storage object.
   */
  from: (filename, callback) => {
    if (callback) return callback(EvgDBCWrapper(filename, "from"));

    return new Promise((resolve, reject) => {resolve(EvgDBCWrapper(filename, "from"))})
  },
  /**
   * Synchronously returns a Legacy EvG 2.0 storage object, with JSON storage support.
   * @param {String} filename - Name of the JSON file or database storage.
   */
  cache: (filename) => new LegacyEvg(filename),
  /**
   * Synchronously returns an EvG 3.0 storage object, and automatically imports the data of a specified JSON storage into the EvG 3.0 database storage. The old JSON storage is deleted afterwards.
   * @param {String} filename - The name of the database storage.
   * @param {String} [optionalJSONfilename] - The name of the JSON file. If unspecified, the value of `filename` is used instead.
   */
  remodel: (filename, optionalJSONfilename) => {
    optionalJSONfilename = optionalJSONfilename || filename;

    return EvgDBCWrapper(filename, "remodel").importJSON(optionalJSONfilename, "delete");
  }
};