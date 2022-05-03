// TODO: move all component utilities into this file

const components = new Map();

module.exports = {

    add(comp) {
        if (comp.maxTime?.time) setTimeout(() => {
            if (comp.calls > -1) {
                comp.maxTime.callback?.(comp.sent);
                comp.endHandler?.(comp.sent, "time");
            }
            comp.calls = -1;
        }, comp.maxTime.time);

        components.set(comp.sent.customId, comp);
    },

    initialize(client) {
        client?.on("interactionCreate", i => {
            if (!i.customId) return;
            const { toggleComponentRow } = require("./index");

            const comp = components.get(i.customId);
            if (!comp || (comp.type == "button" && !i.isButton()) || (comp.type == "menu" && !i.isSelectMenu())) return;

            if (comp.calls < 0) return;
            if (comp.canUse?.length && !comp.canUse.some(id => i.user.id === id || i.member?.roles.has(id))) return i.reply(`> **You do not have permission to use this ${comp.type}.**`, true);;
            if (comp.maxUses?.uses && comp.calls >= comp.maxUses.uses) return;
            comp.calls++;

            if (Array.isArray(comp.toggleableRow?.row) && comp.toggleableRow.row.length) toggleComponentRow(comp.sent.message, {
                ...comp.toggleableRow,
                customId: i.customId
            });
            
            if (comp.handler?.(i) === "noreply" && Array.isArray(comp.toggleableRow?.row) && comp.toggleableRow.row.length) i.noReply();
            if (comp.maxUses?.uses && comp.calls == comp.maxUses.uses) {
                comp.calls = -1;
                comp.maxUses.callback?.(i);
                return comp.endHandler?.(comp.sent, "uses");
            }
        });
    }
}