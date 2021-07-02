/**
 * Creates a new FancyMessage, helping to make the Interface more interactive and aesthetically appealing.
 * @constructor
 * @param {String} title - Title of the FancyMessage
 * @param {String} question - Question asked to the user
 * @param {Array} bullets - List of answers that the user can respond with
 * @param {Object} [options] - Options to customize title type, and bullet type
 * @param {"="|"#"} [options.title] - Customize title type
 * @param {"*"|"-"} [options.bullet] - Customize the bullet type
 */
class FancyMessage {
    constructor(title, question, bullets, options) {
        options = options || { title: "=", bullet: "*" };

        if (options.title == "=") {
            var stylizedTitle = title + "\n===============================";
        }
        else {
            var stylizedTitle = "# " + title + " #";
        }

        var msg = `\`\`\`md\n${stylizedTitle}\`\`\`\n\`\`\`md\n< ${question} >\n\n`;
        var stylizedBullets = "";

        bullets.forEach((bullet) => {
            stylizedBullets += options.bullet + " " + bullet + "\n";
        });

        msg += stylizedBullets + "\n<!-- Menu will close in 5 minutes.\nDo not include punctuation or the command prefix in your response. -->\`\`\`";

        this.get = () => { return msg; };

    }
}

class EmbedMessage {
    /**
     * Creates a new Embed, which can be used with or without the interface.
     * @constructor
     * @param {Object} options - Represents either the Embed's options or String content for a plain message.
     * @param {Object} message - The message containing the call to the currently processing command.
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
     * @param {String} [options.content] - The plain text content of the message itself.
     * @param {String} [options.color] - The color of the Embed border.
     */
    constructor(message, options) {
        let userID = message.author.id;
        var tuser = message.client.users.cache.find(m => m.id == userID);

        if (typeof options === "object" && typeof options !== "string") {

            var {thumbnail, fields, desc, title, footer, icon, image, video, noTimestamp, content, color} = options;

            footer = footer || [tuser.username];
            if (!Array.isArray(footer)) footer = [footer];

            var embed = {embed: {
                "color": color ? color : message.guild ? message.member.displayHexColor : tuser.toString().substring(2, 8),
                "timestamp": !noTimestamp ? new Date() : false,
                "footer": {
                "icon_url": icon || tuser.avatarURL(),
                "text": footer.join(" • ")
                },
                "thumbnail": {
                "url": thumbnail
                },
                "author": {},
                "fields": fields || [],
                "image": {url:image} || {},
                "video": {url:video} || {},
                "description": desc || "",
                "title": title || ""
            }
            };

            if (!thumbnail) embed.embed.thumbnail = {};
            if (content) embed.content = content;

            embed.remove = (property) => {
                delete embed.embed[property];
                return embed;
            }

            embed.set = (property, value) => {
                embed.embed[property] = value;
                return embed;
            }

        }
        else {

            var embed = {
                content: options
            };

        }

        return embed;
    }
}

class Interface {
    /**
     * Creates a new Interface, an interactive means of receiving input from the user.
     * Works fine with FancyMessage.
     * @param {Object | Function} message - Message containing the command that led to calling on the interface
     * @param {String} question - Question to ask user for a response
     */
    constructor(message, question, callback, type, options) {

        var collected = false;
        var closed = false;
        var deleted = false;

        var opts = options || {max: 1};

        var qMessage;
        message.channel.send(question).then((msg) => {
            qMessage = msg;
        });

        const collector = message.channel.createMessageCollector(m => m.author.id == message.author.id, opts);

        collector.on("collect", msg => {
            collected = true;
            callback(msg, qMessage);

            if (!deleted && opts.deleteSelf) {
                deleted = true;
                qMessage.delete();
            }
        });

        collector.on("end", () => {
            closed = true;
            if (!deleted && opts.deleteSelf) {
                deleted = true;
                qMessage.delete();
            }
        });

        setTimeout(() => {
            if (closed) return;
            else if (!collected) {
                collector.stop("User did not give a response within 5 minutes.");
                qMessage.edit(`<a:no_animated:670060124399730699> <@!${message.author.id}>, the menu closed because you did not respond within 5 minutes. ${type.match("report") ? `**Failed to report your ${type.split(".")[1]}.** Please follow ALL of the instructions in the given time to report the ${type.split(".")[1]} properly.` : ""}`);
                closed = true;
                callback(false);
                if (!deleted && opts.deleteSelf) {
                    deleted = true;
                    qMessage.delete();
                }
            }
        }, 5 * 60 * 1000);

    }
}

class ReactionInterface {
    /**
     * Creates a new ReactionInterface, a reaction collector to perform actions on user reaction
     * @param {Object} message - Discord message object
     * @param {String} question - Message to send and collect reactions from
     * @param {function(message, reaction)} callback - Callback to execute on collect
     * @param {Number} [time] - Optional time in milliseconds to wait for reaction
     */
    constructor(message, question, reactions, callback, time, allUsers) {

        message.channel.send(question).then(m => {

            var previous = false;

            reactions.forEach((reaction) => {

                if (previous) previous = previous.then(r => {return m.react(reaction)})
                else previous = m.react(reaction);

                let collector = m.createReactionCollector((r, user) => (r.emoji.name === reaction || r.emoji.id === reaction) && (allUsers || user.id === message.author.id), { time: time || 120000 });

                collector.on("collect", r => {
                    r.users.remove(message.author);

                    callback(m, r);
                });

            });

        });
    }
}

class Paginator {
    /**
     * Creates a new Pagination Interface, a reaction collector that cycles through pages on user reaction
     * @param {Object} message - Discord message object
     * @param {EmbedMessage} embed - Message to send and paginate
     * @param {Object[]} elements - Array of fields to cycle through when paginating
     * @param {String} elements[].name - Field title
     * @param {String} elements[].value - Field content
     * @param {Number} perPage - Number of elements per page
     */
    constructor(message, embed, elements, perPage, allUsers) {

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
        embed.embed.fields = pages[pageIndex];

        embed.embed.footer = embed.embed.footer || {text: ""};
        embed.embed.footer.text += " • " + (pages.length == 0 ? 0 : pageIndex + 1) + "/" + pages.length;

        new ReactionInterface(message, embed, ['⬅️', '➡️'], (m, r) => {

            if (r.emoji.name == '⬅️') {
                //Back
                pageIndex--;

                if (pageIndex < 0) {
                    pageIndex = 0;
                }
                else {
                    embed.embed.fields = pages[pageIndex];
                    embed.embed.footer.text = embed.embed.footer.text.substring(0, embed.embed.footer.text.lastIndexOf("•")) + "• " + (pageIndex + 1) + "/" + pages.length;
                    m.edit(embed);
                }
            }
            else {
                //Forward
                pageIndex++;

                if (pageIndex > pages.length - 1) {
                    pageIndex = pages.length - 1;
                }
                else {
                    embed.embed.fields = pages[pageIndex];
                    embed.embed.footer.text = embed.embed.footer.text.substring(0, embed.embed.footer.text.lastIndexOf("•")) + "• " + (pageIndex + 1) + "/" + pages.length;
                    m.edit(embed);
                }
            }

        }, 1000 * 60 * 60, allUsers);
    }

}

module.exports = {
    Interface: Interface,
    FancyMessage: FancyMessage,
    Embed: EmbedMessage,
    ReactionInterface: ReactionInterface,
    Paginator: Paginator
};