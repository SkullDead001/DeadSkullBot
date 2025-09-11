// utils_admin.js

/**
 * Normaliza un ID de WhatsApp para coincidir con los participantes de groupMetadata
 * @param {string} id
 * @returns {string}
 */
function normalizeId(id) {
    if (!id) return '';
    return id.split(':')[0] + '@s.whatsapp.net';
}

/**
 * Obtiene los administradores y superadministradores de un grupo
 * @param {object} sock - Cliente de WhatsApp
 * @param {string} groupId - ID del grupo
 * @returns {Array<string>} - IDs normalizados de admins
 */
async function getGroupAdmins(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        return metadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin' || p.superadmin === 'superadmin')
            .map(a => normalizeId(a.id));
    } catch (err) {
        console.error("❌ Error obteniendo admins:", err);
        return [];
    }
}

/**
 * Verifica si un usuario es admin o superadmin
 * @param {object} sock
 * @param {string} groupId
 * @param {string} userId
 * @returns {boolean}
 */
async function isAdmin(sock, groupId, userId) {
    try {
        const admins = await getGroupAdmins(sock, groupId);
        return admins.includes(normalizeId(userId));
    } catch (err) {
        console.error("❌ Error verificando admin:", err);
        return false;
    }
}

/**
 * Verifica si el bot es admin o superadmin
 * @param {object} sock
 * @param {string} groupId
 * @returns {boolean}
 */
async function isBotAdmin(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const botId = normalizeId(sock.user.id);
        const admins = metadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin' || p.superadmin === 'superadmin')
            .map(a => normalizeId(a.id));
        return admins.includes(botId);
    } catch (err) {
        console.error("❌ Error verificando bot admin:", err);
        return false;
    }
}

/**
 * Verifica si un remitente es admin y reacciona si no lo es
 * @param {object} sock
 * @param {string} jid - ID del grupo
 * @param {object} msg - Mensaje recibido
 * @returns {boolean} true si es admin, false si no
 */
async function checkAdminAndReact(sock, jid, msg) {
    try {
        const metadata = await sock.groupMetadata(jid);
        const senderId = normalizeId(msg.key.participant || msg.key.remoteJid);
        const senderInfo = metadata.participants.find(p => normalizeId(p.id) === senderId);

        if (!(senderInfo?.admin === 'admin' || senderInfo?.admin === 'superadmin' || senderInfo?.superadmin === 'superadmin')) {
            await sock.sendMessage(jid, {
                react: { text: '🍆', key: msg.key }
            });
            return false;
        }

        return true;
    } catch (err) {
        console.error("❌ Error verificando admin y reaccionando:", err);
        return false;
    }
}

module.exports = {
    normalizeId,
    getGroupAdmins,
    isAdmin,
    isBotAdmin,
    checkAdminAndReact
};