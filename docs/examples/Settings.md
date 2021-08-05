# Settings

Node-elisif contains a settings system that manages both global and local settings. Global settings apply to the entire bot, including across all guilds. Local settings apply to individual guilds; for example, they can be used to configure a different prefix for a guild.

Both global and local settings are built on top of Evergreen Storage, allowing settings to persist via database. You can use settings to create your own custom settings for individual guilds, or modify default settings to configure certain features in node-elisif.

Note: The functionalities of many default settings have not been implemented yet. Settings such as `channelfx` are still being developed.

## Global Settings Example

```js
const elisif = require('elisif');

//Setup global command prefix (/ by default):
elisif.settings.Global().set("global_prefix", "/");
```

## Local Settings Example

```js
const elisif = require('elisif');

//Setup local command prefix in a given guild (based on guild ID):
elisif.settings.Local("a guild ID").set("local_prefix", "!");
```

## Getting and Setting Values

In both global settings and local settings, you can both set and get any setting values. Both global and local have the same structure, and interacting with setting values work the same in both.

### Simple Get

In the VCA expansion, global settings can be configured to define some emotes that are used by the VCA command's activity selection menu. Here is a simple example of getting the global setting value of a VCA youtube emote:

```js
const elisif = require('elisif');

elisif.settings.Global().get("vca.emotes.youtube");
// -> "860640848530112552"
```

### Simple Set

View the above Global Settings Example or Local Settings Example for simple examples of modifying setting values.

### Sample Settings Data Structure

Settings work in a JSON-type structure, just like the node-elisif storage system. Here is an example of what the above VCA setting might look like inside the global settings database table:

```json
{
    "vca": {
        "emotes": {
            "youtube": "860640848530112552"
        },
        "othersetting": "test"
    }
}
```
### Get Using Setting Tables

As you can see in the above example, `vca.emotes.youtube` simply refers to the path to the value in the table. However, you can obtain values from this table without using the path technique. If, for example, you want to obtain both the value of the youtube emote and the value of `othersetting`, you can easily do so by defining a new table with the following syntax:

```js
const elisif = require('elisif');
let table = elisif.settings.Global().table("vca");

let youtube = table.get("emotes.youtube");
// -> "860640848530112552"

let othersetting = table.get("othersetting");
// -> "test"
```

Using this table technique makes it very simple to retrieve multiple properties from a settings object, or even get settings using variables instead of a String literal. Perhaps you may even choose to use it simply to make your logic clearer to readers of your code.

### Set Using Setting Tables

Tables can also be used to set properties and setting values. This is very similar to the above example of getting values via tables.

```js
const elisif = require('elisif');
let table = elisif.settings.Global().table("vca");

table.set("emotes.youtube", "860640848530112552");
```

### Get and Tables With Defaults

Sometimes, when you attempt to get a value or get a setting table, the setting or table does not exist. In these scenarios, you can choose to provide a default value to use instead. If a default value is specified, the value of the settings is set to the default, and the provided default is returned. If a default value is not specified and the setting does not exist, `undefined` is returned.

```js
const elisif = require('elisif');

let emote = elisif.settings.Global().get("nonexistent.emote", "test this");
// -> "test this"

let table = elisif.settings.Global().table("undefinedtable", {
    somesetting: "value"
});
// -> Evg({ somesetting: "value" })

let somesetting = elisif.settings.Global().get("undefinedtable.somesetting");
// -> "value"
```

This default feature work solely with `Global().get()` and `Global().table()`. Any other settings methods, including `Global().set()` and `Global().table().get()`, cannot use the default value parameter.