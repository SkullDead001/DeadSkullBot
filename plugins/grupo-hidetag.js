const { parseCommand, isGroupJid } = require('./_cmd');
const { checkAdminAndReact, isBotAdmin } = require('../utils_admin');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;
  if (!['hidetag', 'notificar', 'notify'].includes(p.command)) return;

  if (!isGroupJid(chat)) {
    await sock.sendMessage(chat, { text: '⚠️ Este comando solo funciona en grupos.' }, { quoted: msg });
    return;
  }

  // Solo admin (puedes quitar esto si quieres)
  const okUser = await checkAdminAndReact(sock, chat, msg);
  if (!okUser) return;

  const okBot = await isBotAdmin(sock, chat);
  if (!okBot) {
    await sock.sendMessage(chat, { text: '⚠️ Necesito ser admin para mencionar a todos correctamente.' }, { quoted: msg });
    return;
  }

  const meta = await sock.groupMetadata(chat);
  const participants = meta?.participants || [];
  const mentions = participants.map(p => p.id);

  const body = p.argText?.trim() || '📢';
  await sock.sendMessage(chat, { text: body, mentions }, { quoted: msg });
};