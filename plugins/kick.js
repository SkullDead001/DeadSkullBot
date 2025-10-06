const { normalizeId, isBotAdmin, checkAdminAndReact } = require('../utils_admin');
const config = require('../config.js');

module.exports = async (sock, msg, text, sender) => {
    // Verificar si el plugin está activado
    if (!config.plugins.kick) return;
    
    if (!text.startsWith(config.bot.prefix + 'kick')) return;

    if (!sender.includes('@g.us')) {
        return sock.sendMessage(sender, { 
            text: config.messages.groupOnly 
        });
    }

    const groupId = msg.key.remoteJid;

    // Verificar si el remitente es admin
    const isAdmin = await checkAdminAndReact(sock, groupId, msg);
    if (!isAdmin) return;

    // Verificar si el bot es admin
    if (!(await isBotAdmin(sock, groupId))) {
        return sock.sendMessage(groupId, { 
            text: config.messages.botAdmin 
        });
    }

    // Obtener usuario mencionado
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) {
        return sock.sendMessage(groupId, { 
            text: config.messages.kick.noMention 
        });
    }

    // Verificar que no sea autokick
    const mentionedNormalized = normalizeId(mentioned);
    const senderNormalized = normalizeId(msg.key.participant || msg.key.remoteJid);
    
    if (mentionedNormalized === senderNormalized) {
        return sock.sendMessage(groupId, { 
            text: config.messages.kick.selfKick,
            react: { text: '😂', key: msg.key }
        });
    }

    // Expulsar usuario
    try {
        await sock.groupParticipantsUpdate(groupId, [mentioned], 'remove');
        await sock.sendMessage(groupId, {
            text: `👢 ${config.messages.kick.success}: @${mentioned.split('@')[0]}`,
            mentions: [mentioned]
        });
    } catch (error) {
        console.error('Error al expulsar:', error);
        await sock.sendMessage(groupId, { 
            text: config.messages.kick.error,
            react: { text: '⚠️', key: msg.key }
        });
    }
};
