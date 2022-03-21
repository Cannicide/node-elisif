const ClientUser = require('./structures/ClientUser');


// ClientUser/ClientApplication ready packet handler override:
require("discord.js/src/client/websocket/handlers")['READY'] = ClientUser.handleReadyPacket;

module.exports = {


}