const CacheManager = require('./CacheManager');
const { Permissions, Role } = require('discord.js');

module.exports = class PermissionManager extends CacheManager {

    #role;
    #p;

    /**
     * @param {Permissions} permissions
     * @param {Role} [role]
     */
    constructor(permissions, role = null) {
        super(permissions?.toArray()?.map(perm => [perm, true]) ?? [], null, permissions);
        this.#role = role;
        this.#p = permissions;
    }

    /**
     * Determines if the entity has all of the specified permissions.
     * If the entity has ADMINISTRATOR, this returns true for any provided permissions.
     * @param  {...any} perms 
     * @returns {Boolean}
     */
    has(...perms) {
        let result = false;
        
        try {
            result = this.#p.has(perms?.flat(), true);
        }
        catch (err) {
            if (!err.name.match("BITFIELD_INVALID")) throw new Error(err.message);
            else console.warn(`Warning: Invalid permission {${err.message.split(": ")[1].slice(0, -1)}} was used in PermissionManager#has().`)
        }

        return result;
    }

    /**
     * Determines if the entity has all of the specified permissions.
     * This does not allow ADMINISTRATOR to always return true, and checks explicitly for permission presence.
     * @param  {...any} perms 
     * @returns 
     */
    hasStrict(...perms) {
        let result = false;
        
        try {
            result = this.#p.has(perms?.flat(), false);
        }
        catch (err) {
            if (!err.name.match("BITFIELD_INVALID")) throw new Error(err.message);
            else console.warn(`Warning: Invalid permission {${err.message.split(": ")[1].slice(0, -1)}} was used in PermissionManager#hasStrict().`)
        }

        return result;
    }

    /**
     * Determines if the entity has at least one of the specified permissions.
     * If the entity has ADMINISTRATOR, this returns true for any provided permissions.
     * @param  {...any} perms 
     * @returns {Boolean}
     */
    any(...perms) {
        let result = false;
        
        try {
            result = this.#p.any(perms?.flat(), true);
        }
        catch (err) {
            if (!err.name.match("BITFIELD_INVALID")) throw new Error(err.message);
            else {
                result = perms?.flat().some(p => this.has(p));
                console.warn(`Warning: Invalid permission {${err.message.split(": ")[1].slice(0, -1)}} was used in PermissionManager#any().`)
            }
        }

        return result;
    }

    /**
     * Determines if the entity has at least one of the specified permissions.
     * This does not allow ADMINISTRATOR to always return true, and checks explicitly for permission presence.
     * @param  {...any} perms 
     * @returns {Boolean}
     */
    anyStrict(...perms) {
        let result = false;
        
        try {
            result = this.#p.any(perms?.flat(), false);
        }
        catch (err) {
            if (!err.name.match("BITFIELD_INVALID")) throw new Error(err.message);
            else {
                result = perms?.flat().some(p => this.hasStrict(p));
                console.warn(`Warning: Invalid permission {${err.message.split(": ")[1].slice(0, -1)}} was used in PermissionManager#anyStrict().`)
            }
        }

        return result;
    }

    /**
     * Determines if the entity has none of the specified permissions.
     * This method always assumes a strict-type check for permissions; thus,
     * this does not allow ADMINISTRATOR to always return true, and checks explicitly for permission presence.
     * @param  {...any} perms 
     * @returns {Boolean}
     */
    none(...perms) {
        return !this.anyStrict(...perms);
    }

    /**
     * Enables the specified permission(s) for a Role, without modifying any of its other existing permissions.
     * Note: This method can only be used on Role permissions. It will throw an error for any other entity.
     * @param {String|Number|*[]} perms 
     * @param {String} [reason] 
     * @returns {String[]} All ENABLED permissions for the Role, after enabling the specified permissions.
     */
    async enable(perms, reason = null) {
        if (!this.#role) throw new Error("Error: Permissions can only be modified on roles."); // new PermissionsImmutableError()
        
        const allPerms = /** @type {String[]} */ (this.toArray());
        perms = [].concat(perms).map(p => ("" + (p ?? "")).toUpperCase());

        for (const x of perms) if (!allPerms.includes(x)) {
            allPerms.push(x);
            super.set(x, true);
        }

        await this.#role.setPermissions(allPerms, reason);
        return allPerms;
    }

    /**
     * Disables the specified permission(s) for a Role, without modifying any of its other existing permissions.
     * Note: This method can only be used on Role permissions. It will throw an error for any other entity.
     * @param {String|Number|*[]} perms 
     * @param {String} reason 
     * @returns {String[]} All ENABLED permissions for the Role, after disabling the specified permissions.
     */
    async disable(perms, reason = null) {
        if (!this.#role) throw new Error("Error: Permissions can only be modified on roles."); // new PermissionsImmutableError()

        const allPerms = /** @type {String[]} */ (this.toArray());
        perms = [].concat(perms).map(p => ("" + (p ?? "")).toUpperCase());

        for (const x of perms) if (allPerms.includes(x)) {
            allPerms.splice(allPerms.indexOf(x), 1);
            super.delete(x);
        }
        
        await this.#role.setPermissions(allPerms, reason);
        return allPerms;
    }

    /**
     * Sets all of the permissions for the role in a more intuitive way than the default discord.js method.
     * Note: This method can only be used on Role permissions. It will throw an error for any other entity.
     * @param {Object<string, boolean>} permsObject - An object mapping a permission name (string) to whether it should be enabled or disabled (boolean).
     * @param {String} reason 
     * @returns {String[]} All ENABLED permissions for the Role, after setting the specified permissions.
     */
    async setAll(permsObject = PermissionManager.toPermsObject(this.toArray()), reason) {
        if (!this.#role) throw new Error("Error: Permissions can only be modified on roles."); // new PermissionsImmutableError()
        const { enable, disable } = PermissionManager.toPermsArray(permsObject);
        let allPerms = null;

        if (disable.length) allPerms = await this.disable(disable, reason);
        if (enable.length) allPerms = await this.enable(enable, reason);

        return allPerms;
    }

    static toPermsObject(permsArray) {
        return permsArray.reduce((obj, perm) => {
            obj[perm] = true;
            return obj;
        }, {});
    }

    static toPermsArray(permsObject) {
        return {
            enable: Object.keys(permsObject).filter(k => permsObject[k]),
            disable: Object.keys(permsObject).filter(k => !permsObject[k])
        };
    }

}