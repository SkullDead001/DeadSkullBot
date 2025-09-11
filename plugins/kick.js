// plugins/kick.js
const { normalizeId, isBotAdmin } = require('../utils_admin');

module.exports = async (sock, msg, text, sender) => {
    if (!text.startsWith('.kick')) return;

    if (!sender.includes('@g.us')) {
        return sock.sendMessage(sender, { text: '🚫 Este comando solo funciona en grupos' });
    }

    const groupId = msg.key.remoteJid;
    const senderId = normalizeId(msg.key.participant || msg.key.remoteJid);

    // Obtener metadata del grupo
    const groupMetadata = await sock.groupMetadata(groupId);

    // Buscar información del remitente
    const senderInfo = groupMetadata.participants.find(p => normalizeId(p.id) === senderId);

    // Verificar si el remitente NO es admin ni superadmin
    if (!(senderInfo?.admin === 'admin' || senderInfo?.admin === 'superadmin' || senderInfo?.superadmin === 'superadmin')) {
        return sock.sendMessage(groupId, {
            react: { text: '🍆', key: msg.key }
        });
    }

    // Verificar si el bot es admin
    if (!(await isBotAdmin(sock, groupId))) {
        return sock.sendMessage(groupId, { text: '⚠️ Necesito ser administrador para poder expulsar' });
    }

    // Obtener usuario mencionado
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) {
        return sock.sendMessage(groupId, { text: '❗ Menciona a un usuario para expulsar' });
    }

    // Expulsar usuario
    await sock.groupParticipantsUpdate(groupId, [mentioned], 'remove');
    await sock.sendMessage(groupId, {
        text: `👢 Usuario @${mentioned.split('@')[0]} fue expulsado`,
        mentions: [mentioned]
    });
};
