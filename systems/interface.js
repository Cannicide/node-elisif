// @ts-check

const { ContentSupplier, ElisifSet, MRPromise, util } = require('../util/Utility');
class Interface {

    /**
     * Creates a new fancy list, displaying a set of answer choices to a question in a fancy code block menu.
     * Can be used by text menu interfaces to create a functional answer selector.
     * @param {Object} options - Options for this fancy list
     * @param {String} options.title - Title of the fancy list
     * @param {String} options.question - Question prompted to the user
     * @param {Set} options.choices - List of answers to the prompted question
     * @param {boolean} [options.isTextMenu] - Whether or not this fancy list is being used for a text menu. Adds a "menu will close" message to the end of the fancy list
     * @param {Number} [options.textMenuTime] - The number of minutes that the text menu will last. Defaults to 5.
     * @param {"="|"#"} [options.titleType] - Select the type of markdown to use when displaying the title
     * @param {"*"|"-"} [options.bulletType] - Select the type of bullet point to use when displaying the answer choices
     * @param {Object} [options.embed] - Options for placing this fancy list within an embed
     * @param {boolean} [options.embed.use] - Whether or not to use an embed to display the fancy list
     * @param {import("discord.js").Message} [options.embed.message] - The discord.js Message to extract default embed options from
     */
    static fancyList({
        title,
        question,
        choices = new Set(),
        titleType = "=",
        bulletType = "*",
        isTextMenu = false,
        textMenuTime = 5,
        embed = { use: false, message: null }
    }) {

        var contentData;
        var bullets = [...choices.values()].map(choice => bulletType + " " + choice).join("\n");
        const messageMenuWarning = `\n\n<!-- Menu will close in ${textMenuTime} minutes.\nDo not include punctuation or the command prefix in your response. -->`;

        //Fancy list for normal message
        if (!embed.use) {

            if (titleType == "=") {
                var stylizedTitle = title + "\n===============================";
            }
            else {
                var stylizedTitle = "# " + title + " #";
            }

            var msg = `\`\`\`md\n${stylizedTitle}\`\`\`\n\`\`\`md\n< ${question} >\n\n`;
            msg += bullets;
            if (isTextMenu) msg += messageMenuWarning;
            msg += "\`\`\`";

            contentData = {content: msg};

        }
        //Fancy list for embed message
        else {

            var msg = `\`\`\`md\n< ${question} >\n\n`;
            msg += bullets;
            if (isTextMenu) msg += messageMenuWarning;
            msg += "\`\`\`";

            contentData = {embeds: [
                Interface.createEmbed({
                    title,
                    desc: msg
                }, embed.message)
            ]};

        }

        return new ContentSupplier("fullContext", contentData);

    }

    /**
     * Creates a new embed object, which can be used with both discord.js methods and node-elisif methods.
     * @param {Object} options - Represents either the Embed's options or String content for a plain message.
     * @param {String} [options.content] - The content of the message to which this embed belongs. Used by ContentSupplier.asEmbedsIfSupplier().
     * @param {String} [options.thumbnail] - The URL to the preferred thumbnail of the Embed.
     * @param {Object[]} [options.fields] - An array of the contents of the Embed, separated by field.
     * @param {String} options.fields[].name - The title of the field.
     * @param {String} options.fields[].value - The content of the field.
     * @param {Boolean} [options.fields[].inline] - Whether or not the field is inline.
     * @param {String} [options.desc] - The description of the Embed.
     * @param {String} [options.title] - The title of the Embed.
     * @param {String[]} [options.footer[]] - An array of footer messages.
     * @param {String} [options.icon] - The URL of the Embed's icon.
     * @param {String} [options.image] - The URL of the Embed's image.
     * @param {String} [options.video] - The URL of the Embed's video.
     * @param {Boolean} [options.noTimestamp] - Whether or not to remove the timestamp from the Embed.
     * @param {String} [options.color] - The color of the Embed border.
     * @param {Object} [message] - The optional message from which to set some default options, such as username in footer.
     */
    static createEmbed({
        thumbnail,
        fields,
        desc,
        title,
        footer,
        icon,
        image,
        video,
        noTimestamp,
        color
    }, message = null) {

        let client = require("../index").getClient(message?.client.user.id);
        let userID = message?.author?.id ?? client?.user.id;
        //@ts-ignore
        var tuser = client?.users.cache.get(userID);

        color = color ?? message?.member?.displayHexColor ?? tuser?.toString().substring(2, 8) ?? "#000000";

        footer = footer ?? [tuser?.username];
        if (!Array.isArray(footer)) footer = [footer];

        var embed = {
            "color": color,
            "timestamp": !noTimestamp ? new Date() : false,
            "footer": footer[0] ? {
                "icon_url": icon ?? tuser?.avatarURL(),
                "text": footer.join(" • ")
            } : undefined,
            "thumbnail": {
                "url": thumbnail
            },
            "author": {},
            "fields": fields ?? [],
            "image": {url:image} ?? {},
            "video": {url:video} ?? {},
            "description": desc ?? "",
            "title": title ?? ""
        };

        if (!thumbnail) embed.thumbnail = undefined;
        return new ContentSupplier("embedContext", embed);

    }

    /**
     * Generates the defined embed(s), returning a message-sendable MessageContentSupplier.
     * @param {Object[]|String|Set|ElisifSet|ContentSupplier|ContentSupplier[]} embeds - An array of embeds to send OR String content of the message OR a ContentSupplier/ContentSupplier[] containing message content data.
     * @param {import("discord.js").Message} [message] - The optional message from which to set some default options, such as username in footer.
    */
    static genEmbeds(embeds = [], message = null) {
        let embedsData = [], content = null;

        //Handle all possible datatypes of `embeds`
        if (typeof embeds === "string") content = embeds;
        else if (Array.isArray(embeds)) embedsData = embeds;
        else if (embeds instanceof ElisifSet) embedsData = embeds.toArray();
        else if (embeds instanceof Set) embedsData = [...embeds.values()];
        else if (embeds instanceof ContentSupplier && (embeds.origin == "fullContext")) {
            content = embeds.content;
            embedsData = embeds.embeds ?? embedsData;
        }
        else if ((embeds instanceof ContentSupplier && embeds.origin == "embedContext") || typeof embeds === "object") {
            embedsData = [embeds];
            content = embeds.content;
        }
        
        //Generate embeds from any object literals in `embedsData`
        embedsData = embedsData.map(embed => {
            if (embed instanceof ContentSupplier && embed.origin == "embedContext") return embed;
            return Interface.createEmbed(embed, message);
        });

        //Construct and return the message

        return new ContentSupplier("fullContext", {
            "embeds": embedsData,
            "content": content
        });
    }

    /**
     * Generates and sends the defined embed(s) to the provided channel.
     * One of message or channel MUST be specified; if neither is specified, an error is thrown.
     * @param {Object[]|String|Set|ElisifSet|ContentSupplier|ContentSupplier[]} embeds - An array of embeds to send OR String content of the message OR a ContentSupplier/ContentSupplier[] containing message content data.
     * @param {import("discord.js").Message} [message] - The optional message from which to set some default options, such as username in footer.
     * @param {import("discord.js").TextChannel|import("discord.js").DMChannel|import("discord.js").NewsChannel} [channel] - The optional channel to send the embeds to.
     * @param {String} [content] - The optional content of the message containing the embeds.
    */
    static embed(embeds = [], message = null, channel = null, content = null) {

        if (!message && !channel) throw new Error("Neither message nor channel was provided; cannot retrieve channel to send the embed(s) to.");
        
        channel = channel ?? message.channel;

        //Construct and send the message

        let supplier = Interface.genEmbeds(embeds, message);
        return channel.send(supplier);

    }

    /**
     * Creates and sends a new text menu interface, using a fancy list as the question in place of a standard message.
     * The list menu interface is a functional choice selector, which displays several choices and allows the user to pick from them.
    */
    static async listMenu({
        fancyListOptions = {},
        textMenuOptions = {}
    }) {
        // @ts-ignore
        const fancyList = Interface.fancyList(fancyListOptions);

        // @ts-ignore
        textMenuOptions.question = fancyList;
        // @ts-ignore
        textMenuOptions.maxResponses = 1;

        // @ts-ignore
        return Interface.textMenu(textMenuOptions);
    }

    /**
     * Creates and sends a new text menu interface, an interactive means of receiving message input from the user.
     * Can be used with interface.fancyList().
     * @param {Object} opts - The options for the text menu.
     * @param {import("discord.js").Message} opts.message - The message to respond to with this text menu.
     * @param {String|ContentSupplier} opts.question - Question to ask user for a response
     * @param {String} [opts.error] - An additional error message to display if the user does not respond in time.
     * @param {String} [opts.errorEmoji] - An optional error emote to display if the user does not respond in time. Defaults to an emote in Cannicide's test server (used by my bots).
     * @param {Number} [opts.maxResponses] - The maximum number of responses the user can provide before the bot responds / promise fulfills. Defaults to 1.
     * @param {Object} [opts.options] - An object containing extra options for the discord.js message collector used by the text menu.
     * @param {Number} [opts.time] - The time limit for the user to respond, in minutes. Defaults to 5 minutes.
     * @param {boolean} [opts.deleteSelf] - Whether or not the text menu should delete the question message once the user has answered or time has run out.
     * @returns {Promise<{responses: ElisifSet, question: import("discord.js").Message}>} - A promise that resolves with the responses and question message.
     */
    static async textMenu({
        message,
        question,
        error,
        errorEmoji = "<a:no_animated:670060124399730699>",
        maxResponses = null,
        options = {max: 1},
        time = 5,
        deleteSelf = false
    }) {

        var collected = false;
        var closed = false;
        var deleted = false;

        options.max = maxResponses ?? options.max ?? 1;
        options.filter = m => m.author.id == message.author.id;

        var qMessage = await message.channel.send(ContentSupplier.asEmbedsIfSupplier(question));

        const responses = new ElisifSet();
        const collector = message.channel.createMessageCollector(options);

        //Deletion method
        const deleteQuestion = () => {
            if (!deleted && deleteSelf) {
                deleted = true;
                qMessage.delete();
            }
        };

        return new Promise((resolve, reject) => {

            collector.on("collect", msg => {
                responses.add(msg);

                if (responses.size >= options.max) {
                    collected = true;
                    // @ts-ignore
                    resolve({responses, question: qMessage});
                    deleteQuestion();
                }
            });

            collector.on("end", () => {
                closed = true;
                deleteQuestion();
            });

            setTimeout(() => {
                if (closed || collected) return;

                const reason = `User did not give ${responses.size == 0 ? "a response" : "enough responses"} within ${time} minutes.`;

                collector.stop(reason);
                reject(reason);

                qMessage.edit(`${errorEmoji} <@!${message.author.id}>, the menu closed because you did not respond within ${time} minutes. ${error ?? ""}`);
                closed = true;
                deleteQuestion();

            }, time * 60 * 1000);

        });

    }

    /**
     * Creates and sends a new reaction menu, a reaction collector to perform actions on user reaction.
     * 
     * Note: `Interface.reactMenu()` returns an MRPromise. Unlike regular Promises, the output of an MRPromise can only be retrieved with `MRPromise.manyThen((message, reaction) => void)`.
     * Errors can also only be received using `MRPromise.manyCatch(reason => void)`. If multiple promise rejection errors occur, the method defined by `.manyCatch()` will execute for each error.
     * The MRPromise is used instead of a regular Promise because it can resolve multiple times. This means the method defined by `.manyThen()` will execute every time a valid reaction is received.
     * 
     * Example use: `Interface.reactMenu({...}).manyThen((m, r) => ...).manyCatch(reason => ...)`
     * 
     * @param {Object} options - The options for the reaction menu
     * @param {import("discord.js").Message} options.message - The message to respond to with this reaction menu
     * @param {String} options.question - Message to send and collect reactions from
     * @param {String[]} options.reactions - Reactions to send and collect with this reaction menu
     * @param {Number} [options.time] - Optional time in minutes to wait for any of the given reactions. Defaults to 2 minutes.
     * @param {boolean} [options.allUsers] - Whether to collect the reactions of all users, or just the author of the message. Defaults to false (just the author).
     * @returns {MRPromise} - A multi-resolve promise that resolves with the question message and reactions.
     */
    static reactMenu({
        message,
        question,
        reactions = [],
        time = 2,
        allUsers = false
    }) {

        var previous = false;
        var collected = false;

        // @ts-ignore
        return new MRPromise(async () => {
            return message.channel.send(ContentSupplier.asEmbedsIfSupplier(question));
        }, (m, resolve, reject) => {

            reactions.forEach((reaction) => {

                // @ts-ignore
                if (previous) previous = previous.then(_r => {return m.react(reaction)})
                // @ts-ignore
                else previous = m.react(reaction);

                let filter = (r, user) => (r.emoji.name === reaction || r.emoji.id === reaction) && (allUsers || user.id === message.author.id);
                let collector = m.createReactionCollector({ filter, time: time * 60 * 1000 });

                collector.on("collect", r => {
                    r.users.remove(message.author);

                    collected = true;
                    resolve(m, r);
                });

            });

            setTimeout(() => {

                if (m.channel.type != "DM") m.reactions.removeAll();

                if (collected) return;
                reject(`User did not react within ${time} minutes.`);

            }, time * 60 * 1000);

        });
    }

    /**
     * Creates and sends a new button menu, a button collector to perform actions on user button click.
     * 
     * Note: `Interface.buttonMenu()` returns an MRPromise. Unlike regular Promises, the output of an MRPromise can only be retrieved with `MRPromise.manyThen((buttonInteraction) => void)`.
     * Errors can also only be received using `MRPromise.manyCatch(reason => void)`. If multiple promise rejection errors occur, the method defined by `.manyCatch()` will execute for each error.
     * The MRPromise is used instead of a regular Promise because it can resolve multiple times. This means the method defined by `.manyThen()` will execute every time a valid reaction is received.
     * 
     * Example use: `Interface.buttonMenu({...}).manyThen((m, r) => ...).manyCatch(reason => ...)`
     * 
     * @param {Object} options - The options for the button menu
     * @param {import("discord.js").Message} options.message - The Message or CommandInteraction to respond to with this button menu
     * @param {String} options.question - Message or embed to send and collect button clicks from
     * @param {Object[]|Set} options.buttons - Array or Set of button objects to send and collect clicks from with this button menu
     * @param {Number} [options.time] - Optional time in minutes to wait before closing the button menu. Defaults to 2 minutes.
     * @param {boolean} [options.allUsers] - Whether to collect the clicks of all users, or just the author of the message. Defaults to false (just the author).
     * @param {boolean} [options.disableOnEnd] - Whether to disable the provided buttons in the button menu when the menu closes. Defaults to true.
     * @returns {MRPromise} - A multi-resolve promise that resolves with the clicked button.
     */
     static buttonMenu({
        message,
        question,
        buttons = new Set(),
        time = 2,
        allUsers = false,
        disableOnEnd = true
    }) {

        var collected = false;

        util.Message(message);
        // @ts-ignore
        message.util.Channel();

        const set = ElisifSet.from(buttons);
        // @ts-ignore
        const author = message.util.author;

        // @ts-ignore
        return new MRPromise(async () => {
            // @ts-ignore
            return message.channel.util.button(question, set.toArray());
        }, (m, resolve, reject) => {

            m.startButtonCollector(button => {

                if (!allUsers && button.user.id != author.id) return;

                collected = true;
                util.Component(button);
                resolve(button);

            });

            setTimeout(() => {

                m.endButtonCollector();
                if (disableOnEnd) set.toArray().forEach((_v, index) => m.buttons.get(index).disable());

                if (collected) return;
                reject(`User did not click a button within ${time} minutes.`);

            }, time * 60 * 1000);

        });
    }

    /**
     * Creates and sends a new reaction pagination menu, a reaction collector that cycles through pages of an embed on user reaction
     * @param {Object} options - The options for the reaction pagination menu
     * @param {import("discord.js").Message} options.message - Discord message object
     * @param {ContentSupplier|Object} options.embed - The embed to send and paginate 
     * @param {Object[]} options.elements - Array of fields to cycle through when paginating
     * @param {String} options.elements[].name - Field title
     * @param {String} options.elements[].value - Field content
     * @param {Number} options.perPage - Number of elements per page. Defaults to 2.
     * @param {boolean} [options.allUsers] - Whether all users can interact with the pagination menu, or just the author of the provided message. It is recommended to keep this false for the best experience. Defaults to false.
     * @param {Number} [options.time] - The amount of time in minutes to run the pagination menu for.
     */
    static async reactionPaginator({
        message,
        embed,
        elements = [],
        perPage = 2,
        allUsers = false,
        time = 10
    }) {

        if (!(embed instanceof ContentSupplier) || embed.origin != "embedContext") embed = Interface.createEmbed(embed, message);

        var insertions = 0;
        var pages = [];
        var page = [];
        var pageIndex = 0;
        
        elements.forEach((elem) => {
            insertions++;

            page.push(elem);
            if (insertions == perPage) {
                pages.push(page);
                page = [];
                insertions = 0;
            }
        });

        if (pages[pages.length - 1] != page && page.length != 0) pages.push(page);
        embed.fields = pages[pageIndex];

        embed.footer = embed.footer ?? {text: ""};
        embed.footer.text += " • " + (pages.length == 0 ? 0 : pageIndex + 1) + "/" + pages.length;

        const menu = Interface.reactMenu({
            message,
            question: embed,
            reactions: ['⬅️', '➡️'],
            time,
            allUsers
        });

        // @ts-ignore
        menu.manyThen((m, r) => {

            if (r.emoji.name == '⬅️') {
                //Back
                pageIndex--;

                if (pageIndex < 0) {
                    pageIndex = 0;
                }
                else {
                    embed.fields = pages[pageIndex];
                    embed.footer.text = embed.footer.text.substring(0, embed.footer.text.lastIndexOf("•")) + "• " + (pageIndex + 1) + "/" + pages.length;
                    m.edit({embeds: [embed]});
                }
            }
            else {
                //Forward
                pageIndex++;

                if (pageIndex > pages.length - 1) {
                    pageIndex = pages.length - 1;
                }
                else {
                    embed.fields = pages[pageIndex];
                    embed.footer.text = embed.footer.text.substring(0, embed.footer.text.lastIndexOf("•")) + "• " + (pageIndex + 1) + "/" + pages.length;
                    m.edit({embeds: [embed]});
                }
            }

        });

    }

    /**
     * Creates and sends a new button pagination menu, a button menu that cycles through pages of an embed on button click
     * @param {Object} options - The options for the button pagination menu
     * @param {import("discord.js").Message} options.message - Discord Message or CommandInteraction object
     * @param {ContentSupplier|Object} options.embed - The embed to send and paginate 
     * @param {Object[]} options.elements - Array of fields to cycle through when paginating
     * @param {String} options.elements[].name - Field title
     * @param {String} options.elements[].value - Field content
     * @param {Number} options.perPage - Number of elements per page. Defaults to 2.
     * @param {boolean} [options.allUsers] - Whether all users can interact with the pagination menu, or just the author of the provided message. It is recommended to keep this false for the best experience. Defaults to false.
     * @param {boolean} [options.disableOnEnd] - Whether to disable the provided buttons in the button menu when the menu closes. Defaults to true.
     * @param {String} [options.prevEmote] - The emote to use for the "previous" button. None by default.
     * @param {String} [options.nextEmote] - The emote to use for the "next" button. None by default.
     * @param {String} [options.prevColor] - The color to use for the "previous" button. Blue by default.
     * @param {String} [options.nextColor] - The color to use for the "next" button. Blue by default.
     * @param {Number} [options.time] - The amount of time in minutes to run the pagination menu for.
     */
     static async buttonPaginator({
        message,
        embed,
        elements = [],
        perPage = 2,
        allUsers = false,
        disableOnEnd = true,
        prevEmote = null,
        nextEmote = null,
        prevColor = "blue",
        nextColor = "blue",
        time = 10
    }) {

        if (!(embed instanceof ContentSupplier) || embed.origin != "embedContext") embed = Interface.createEmbed(embed, message);

        var insertions = 0;
        var pages = [];
        var page = [];
        var pageIndex = 0;
        
        elements.forEach((elem) => {
            insertions++;

            page.push(elem);
            if (insertions == perPage) {
                pages.push(page);
                page = [];
                insertions = 0;
            }
        });

        if (pages[pages.length - 1] != page && page.length != 0) pages.push(page);
        embed.fields = pages[pageIndex];

        embed.footer = embed.footer ?? {text: ""};
        embed.footer.text += " • " + (pages.length == 0 ? 0 : pageIndex + 1) + "/" + pages.length;

        const menu = Interface.buttonMenu({
            message,
            question: embed,
            buttons: [{
                color: prevColor,
                emoji: prevEmote,
                label: "Previous",
                disabled: true
            }, {
                color: nextColor,
                emoji: nextEmote,
                label: "Next",
                disabled: pages.length <= 1
            }],
            time,
            allUsers,
            disableOnEnd
        });

        // @ts-ignore
        menu.manyThen(button => {

            button.deferUpdate();
            let m = button.message;
            util.Component(button);


            if (button.util.label == 'Previous') {
                //Back
                pageIndex--;
                let components = m.components;

                if (pageIndex == 0) {
                    components[0].components[0].setDisabled(true);
                    // m.client.debug("Disabling Previous button");
                }
                if (pageIndex < pages.length - 1) {
                    let nextBtn = button.util.manager.get(1);
                    if (nextBtn.disabled) {
                        components[0].components[1].setDisabled(false);
                        // m.client.debug("Enabling Next button");
                    }
                }

                embed.fields = pages[pageIndex];
                embed.footer.text = embed.footer.text.substring(0, embed.footer.text.lastIndexOf("•")) + "• " + (pageIndex + 1) + "/" + pages.length;
                m.edit({embeds: [embed], components});
            }
            else if (button.util.label == 'Next') {
                //Forward
                pageIndex++;
                let components = m.components;

                if (pageIndex == pages.length - 1) {
                    components[0].components[1].setDisabled(true);
                    // m.client.debug("Disabling Next button");
                }
                if (pageIndex > 0) {
                    let prevBtn = button.util.manager.get(0);
                    if (prevBtn.disabled) components[0].components[0].setDisabled(false);
                    // m.client.debug("Enabling Previous button");
                }

                embed.fields = pages[pageIndex];
                embed.footer.text = embed.footer.text.substring(0, embed.footer.text.lastIndexOf("•")) + "• " + (pageIndex + 1) + "/" + pages.length;
                m.edit({embeds: [embed], components});
            }

        });

    }

}

module.exports = Interface;