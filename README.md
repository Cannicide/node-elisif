# node-elisif for Discord.js v12.5.3
[![Node Package](https://github.com/Cannicide/node-elisif/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Cannicide/node-elisif/actions/workflows/npm-publish.yml) [![NPM Version](https://img.shields.io/npm/v/elisif?maxAge=2400)](https://www.npmjs.com/package/elisif) [![NPM Downloads](https://img.shields.io/npm/dt/elisif?maxAge=2400)](https://www.npmjs.com/package/elisif)

[![NPM Badge](https://nodei.co/npm/elisif.png?downloads=true&stars=true)](https://nodei.co/npm/elisif)


## Information
A powerful Discord Bot container, command handler, and vast extension of discord.js designed to be both simplistic and feature-rich. Based on the command handler and various systems I developed for my three discord bots: Elisif, Panacea, and Scavenger.

**Note: buttons, select menus, threads, and slash commands are only partially supported and may not work.** Certain parts of the code, especially these new features, *may* cause errors. These features may even stop working entirely due to the deprecation of discord.js 12.5.3 and changes in the Discord API. If you encounter any issues, please **DO NOT** report them via Issue on the Github repository. This version of the package is no longer supported, and many issues encountered may not be fixable. Use at your own risk.

Support for buttons and select menus has been added! Support for Voice Channel Activities (VCA) has been added; note, however, that this Discord feature is limited as it is still in early beta. Support for slash commands has also been added, designed to work very similarly to classic commands. Partial support for thread channels has also been added, including creating, editing, archiving, deleting, and adding members to threads! Thread-based events and events in threads, however, are not supported due to lack of support for such events in Discord API v8.

Limited [documentation](https://github.com/Cannicide/node-elisif/blob/v12/docs) currently exists for this module, found in the `docs` folder of the Github repository. The docs for this v12 branch of the package are incomplete, and will unfortunately not be completed due to many of its features breaking as a result of the latest updates to discord.js. The docs for the more updated main and dev branches most likely will not work for projects using this branch, as much of the package will be rewritten to support discord.js 13.x.x.

**Created by Cannicide#2753**
