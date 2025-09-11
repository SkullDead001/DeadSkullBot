const { isAdmin } = require('../utils_admin');

module.exports = async (sock, msg, text, sender) => {
    if (text !== '.menu') return;

    const groupId = msg.key.remoteJid;
    const userId = msg.key.participant || sender;

    const admin = groupId.endsWith('@g.us') ? await isAdmin(sock, groupId, userId) : false;

    // Cabecera del menú
    let menu = `╔════════════════════╗\n`;
    menu += `║ ☠️ DeadSkull Bot ☠️ ║\n`;
    menu += `╚════════════════════╝\n\n`;
    menu += `📋 *Menú de Comandos*\n`;
    menu += `─────────────────────\n\n`;

    // Comandos generales
    menu += `💡 *Comandos Generales*\n`;
    menu += `─────────────────────\n`;
    menu += `• .ping → Comprueba si el bot responde 🏓\n`;
    menu += `• .menu → Muestra este menú 📖\n`;
    menu += `• .info → Información del bot ℹ️\n\n`;

    // Comandos de administrador (si aplica)
    if (admin) {
        menu += `🔐 *Comandos de Administrador*\n`;
        menu += `─────────────────────\n`;
        menu += `• .kick @user → Expulsar miembro ❌\n`;
        menu += `• .promote @user → Dar admin 🆙\n`;
        menu += `• .demote @user → Quitar admin ⬇️\n`;
        menu += `• .cerrar → Cerrar grupo 🔒\n`;
        menu += `• .abrir → Abrir grupo 🔓\n\n`;
    }

    // Sección de utilidades o diversión
    menu += `🎮 *Comandos Divertidos / Utilidades*\n`;
    menu += `─────────────────────\n`;
    menu += `• .meme → Envía un meme 😂\n`;
    menu += `• .joke → Cuenta un chiste 🤡\n`;
    menu += `• .quote → Frase motivadora ✨\n\n`;

    // Footer
    menu += `─────────────────────\n`;
    menu += `⚡ Bot creado por DeadSkull ⚡\n`;
    menu += `💬 Disfruta usando el bot!\n`;

    await sock.sendMessage(sender, { text: menu });
};