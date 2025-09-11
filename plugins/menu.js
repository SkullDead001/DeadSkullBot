const { isAdmin } = require('../utils_admin');

module.exports = async (sock, msg, text, sender) => {
    if (text !== '.menu') return;

    const groupId = msg.key.remoteJid;
    const userId = msg.key.participant || sender;

    let menu = `☠️ *DeadSkull Bot* ☠️\n\n`;
    menu += `📋 *Menú de comandos*\n\n`;

    // --- Comandos para todos ---
    menu += `✅ *Comandos para todos*\n`;
    menu += `• .ping → prueba si el bot responde\n`;
    menu += `• .menu → muestra este menú\n\n`;

    // --- Comandos para admins ---
    const admin = groupId.endsWith('@g.us') ? await isAdmin(sock, groupId, userId) : false;

    if (admin) {
        menu += `🔐 *Comandos de administradores*\n`;
        menu += `• .kick @user → expulsar miembro\n`;
        menu += `• .promote @user → subir a admin\n`;
        menu += `• .demote @user → quitar admin\n`;
        menu += `• .cerrar → cerrar grupo\n`;
        menu += `• .abrir → abrir grupo\n`;
    }

    await sock.sendMessage(sender, { text: menu });
};