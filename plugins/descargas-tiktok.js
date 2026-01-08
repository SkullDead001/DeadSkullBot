const { parseCommand } = require('./_cmd');
const axios = require('axios');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;

  const cmds = ['tt', 'tiktok', 'tiktokdl', 'ttdl', 'ttnowm'];
  if (!cmds.includes(p.command)) return;

  const url = p.argText?.trim();
  if (!url) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <url de tiktok>` }, { quoted: msg });
    return;
  }

  try {
    const api = `https://api.dorratz.com/v2/tiktok-dl?url=${encodeURIComponent(url)}`;
    const r = (await axios.get(api, { timeout: 30000 })).data;

    const videoUrl = r?.data?.media?.nowm || r?.data?.media?.org;
    if (!videoUrl) throw new Error('No pude sacar el video (API).');

    await sock.sendMessage(chat, { video: { url: videoUrl }, caption: '✅ TikTok listo.' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error TikTok: ${e?.message || e}` }, { quoted: msg });
  }
};