const { parseCommand } = require('./_cmd');
const fg = require('api-dylux');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;

  const cmds = ['facebook', 'fb', 'facebookdl', 'fbdl'];
  if (!cmds.includes(p.command)) return;

  const url = p.argText?.trim();
  if (!url) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <url de facebook>` }, { quoted: msg });
    return;
  }

  try {
    const r = await fg.fbdl(url);
    const videoUrl = r?.video || r?.hd || r?.sd || r?.url;
    if (!videoUrl) throw new Error('No pude obtener el video de Facebook.');

    await sock.sendMessage(chat, { video: { url: videoUrl }, caption: '✅ Facebook listo.' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error FB: ${e?.message || e}` }, { quoted: msg });
  }
};