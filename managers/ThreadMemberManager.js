// Manages Thread Members in a Thread Channel
// Based on unstable discord.js v13 code, but adapted to work with discord.js v12
// Note: though Elisif supports managing and manipulating threads, it does not support events in threads due to API version differences.

const { BaseManager, Collection } = require("discord.js");
const ThreadMember = require("../structures/ThreadMember");

/**
 * Manages API methods for GuildMembers and stores their cache.
 * @extends {CachedManager}
 */
class ThreadMemberManager extends BaseManager {
  constructor(thread, iterable) {
    super(thread.client, iterable, ThreadMember);

    /**
     * The thread this manager belongs to
     * @type {ThreadChannel}
     */
    this.thread = thread;
  }

  /**
   * The cache of this Manager
   * @type {Collection<Snowflake, ThreadMember>}
   * @name ThreadMemberManager#cache
   */

  _add(data, cache = true) {
    const existing = this.cache.get(data.user_id);
    if (cache) existing?._patch(data);
    if (existing) return existing;

    const member = new ThreadMember(this.thread, data);
    if (cache) this.cache.set(data.user_id, member);
    return member;
  }

  /**
   * Data that resolves to give a ThreadMember object. This can be:
   * * A ThreadMember object
   * * A User resolvable
   * @typedef {ThreadMember|UserResolvable} ThreadMemberResolvable
   */

  /**
   * Resolves a {@link ThreadMemberResolvable} to a {@link ThreadMember} object.
   * @param {ThreadMemberResolvable} member The user that is part of the thread
   * @returns {?GuildMember}
   */
  resolve(member) {
    const memberResolvable = super.resolve(member);
    if (memberResolvable) return memberResolvable;
    const userResolvable = this.client.users.resolveID(member);
    if (userResolvable) return super.resolve(userResolvable);
    return null;
  }

  /**
   * Resolves a {@link ThreadMemberResolvable} to a {@link ThreadMember} id string.
   * @param {ThreadMemberResolvable} member The user that is part of the guild
   * @returns {?Snowflake}
   */
  resolveID(member) {
    const memberResolvable = super.resolveID(member);
    if (memberResolvable) return memberResolvable;
    const userResolvable = this.client.users.resolveID(member);
    return this.cache.has(userResolvable) ? userResolvable : null;
  }

  /**
   * Adds a member to the thread.
   * @param {UserResolvable|'@me'} member The member to add
   * @param {string} [reason] The reason for adding this member
   * @returns {Promise<Snowflake>}
   */
  add(member, reason) {
    const id = member === '@me' ? member : this.client.users.resolveID(member);
    if (!id) return Promise.reject(new Error('INVALID_TYPE: The specified member could not be found.'));
    return this.client.api
      .channels(this.thread.id, 'thread-members', id)
      .put({ reason })
      .then(() => id);
  }

  /**
   * Remove a user from the thread.
   * @param {Snowflake|'@me'} id The id of the member to remove
   * @param {string} [reason] The reason for removing this member from the thread
   * @returns {Promise<Snowflake>}
   */
  remove(id, reason) {
    return this.client.api
      .channels(this.thread.id, 'thread-members', id)
      .delete({ reason })
      .then(() => id);
  }

  /**
   * Fetches member(s) for the thread from Discord, requires access to the `GUILD_MEMBERS` gateway intent.
   * @param {boolean} [cache=true] Whether or not to cache the fetched members
   * @returns {Promise<Collection<Snowflake, ThreadMember>>}
   */
  async fetch(cache = true) {
    const raw = await this.client.api.channels(this.thread.id, 'thread-members').get();
    return raw.reduce((col, rawMember) => {
      const member = this._add(rawMember, cache);
      return col.set(member.id, member);
    }, new Collection());
  }
}

module.exports = ThreadMemberManager;