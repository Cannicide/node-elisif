const ExtendedStructure = require('./ExtendedStructure');
const { asMessageOptions, Emap } = require('../util');
const { MessageEmbed: BaseMessageEmbed, MessageAttachment } = require('discord.js');

module.exports = class MessageEmbed extends ExtendedStructure {

    /** @type {BaseMessageEmbed} */
    #e;
    #files = [];
    constructor(embedOrContent = null, djsEmbedInstance) {
        super(null, djsEmbedInstance ??= new BaseMessageEmbed(asMessageOptions(embedOrContent)));
        this.#e = djsEmbedInstance;
        if (asMessageOptions(embedOrContent).content) this.setContent(embedOrContent);
    }

    toJSON() {
        return { ...this.#e.toJSON(), content: this.content };
    }

    get author() {
        return this.#e.author;
    }

    get color() {
        return this.#e.color;
    }

    get description() {
        return this.#e.description;
    }

    get fields() {
        return this.#e.fields;
    }

    get footer() {
        return this.#e.footer;
    }

    get image() {
        return this.#e.image;
    }

    get thumbnail() {
        return this.#e.thumbnail;
    }

    get timestamp() {
        return this.#e.timestamp;
    }

    get title() {
        return this.#e.title;
    }

    get url() {
        return this.#e.url;
    }

    is(otherStructure) {
        return Emap.matches(this, otherStructure);
    }

    setContent(content) {
        this.content = asMessageOptions(content).content;
        return this;
    }

    setImage(urlOrData, filename = null) {
        if (urlOrData instanceof Buffer) {
            //Support for buffer data in images
            if (!filename || !filename.match(".")) throw new Error("Filename with extension must be provided when using buffer data in embed images.");
            this.#files.push(new MessageAttachment(urlOrData, filename));
            urlOrData = "attachment://" + filename;
        }

        this.#e.setImage(urlOrData);
        return this;
    }

    setTitle(title, url) {
        if (title) this.#e.setTitle(title);
        if (url) this.#e.setURL(url);
        return this;
    }

    /**
     * Sets multiple properties of this embed, returning this instance.
     * Warning: when using this method, data values are not validated; specifying invalid values may result in errors.
     * @param {String|MessageEmbedResolvable} optsOrContent 
     */
    set(optsOrContent) {
        if (optsOrContent instanceof MessageEmbed) {
            const files = optsOrContent.getBufferImageAttachments();
            this.#files = this.#files.concat(files);

            optsOrContent = optsOrContent.toJSON();
        }
        
        optsOrContent = asMessageOptions(optsOrContent);
        for (const x in optsOrContent) this.#e[x] = optsOrContent[x];
        return this;
    }

    /** @private */
    getBufferImageAttachments() {
        return this.#files;
    }

}