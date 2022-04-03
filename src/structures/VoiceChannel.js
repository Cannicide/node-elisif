const VoiceBasedChannel = require('./VoiceBasedChannel');
const VCActivityManager = require('../managers/VCActivityManager');
const GuildChannelInterface = require('./GuildChannelInterface');

class VoiceChannel extends VoiceBasedChannel {

    #t;
    #muteChannel = null;
    constructor(client, channel) {
        super(client, channel);
        this.#t = channel;

        // TODO: add voice methods if voice dependencies enabled
    }

    get voiceActivities() {
        return new VCActivityManager(this);
    }

    /**
     * Returns an Invite to the stream of the specified user.
     * The invite will only lead to a stream if, of course, the user is actually streaming.
     * @param {*} userResolvable - A User instance or id.
     * @param {Object} [inviteOpts] 
     * @returns {Promise<import('discord.js').Invite>}
     */
     viewStream(userResolvable, inviteOpts = { maxAge: 86400, maxUses: 0, temporary: false, unique: false }) {
        return this.#t.createInvite({
            ...inviteOpts,
            targetType: 1,
            targetUser: userResolvable
        });
    }

    // TODO: add muted channel manager
    get mutedChannel() {
        return this.#muteChannel;
    }

    createMutedChannel(name, allowedRoleIds = [], mutedChannelOptions = { welcomeMessage: null }) {
        if (this.#muteChannel !== null) throw new Error('Cannot create a new muted channel; one already exists for this VC.');

        name = name.replace("{name}", this.name);
        const createMuteChannel = async () => {
            this.#muteChannel = await this.#t.guild.channels.create(name, {
                topic: "A channel associated with VC <**" + this.name + "**> for mutes to chat in.",
                ...mutedChannelOptions,
                parent: this.#t.parentId,
                permissionOverwrites: [...this.members.keys()].concat(allowedRoleIds).map(id => ({
                    id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                    type: allowedRoleIds.includes(id) ? 'role' : 'member'
                })).concat({
                    id: this.#t.guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL'],
                    type: 'role'
                })
            });
            this.#muteChannel.setPosition(this.position + 1);
        };
        const removeMuteChannel = async () => {
            if (!this.#muteChannel) return;
            await this.#muteChannel.delete();
            this.#muteChannel = false;
        };

        this.client.onRaw("voiceStateUpdate", async (oldState, newState) => {
            if (newState.channelId !== this.id && oldState.channelId !== this.id) return;

            if (newState.channelId && !oldState.channelId) {
                // Member joined channel
                if (!this.#muteChannel) await createMuteChannel();

                await this.#muteChannel.permissionOverwrites.edit(newState.member.user, {
                    'VIEW_CHANNEL': true,
                    'SEND_MESSAGES': true
                });
                if (mutedChannelOptions.welcomeMessage !== false) await this.#muteChannel.send({
                    content: mutedChannelOptions.welcomeMessage ?? `Welcome to the auto-generated muted channel for VC <**${this.name}**>, ${newState.member}.`
                });
            }
            else {
                // Member left channel
                if (this.#muteChannel) await this.#muteChannel.permissionOverwrites.edit(newState.member.user, {
                    'VIEW_CHANNEL': false,
                    'SEND_MESSAGES': false
                });

                if (this.members.size == 0) await removeMuteChannel();
            }
        });
    }

}

GuildChannelInterface.applyToClass(VoiceChannel);
module.exports = VoiceChannel;