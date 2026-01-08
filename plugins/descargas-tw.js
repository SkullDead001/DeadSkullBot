const { parseCommand } = require('./_cmd');
const axios = require('axios');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;

  const cmds = ['tw', 'twitter', 'x', 'twdl', 'twitterdl', 'dlx'];
  if (!cmds.includes(p.command)) return;

  const url = p.argText?.trim();
  if (!url) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <url de twitter/x>` }, { quoted: msg });
    return;
  }

  try {
    const api = `https://delirius-apiofc.vercel.app/download/twitter?url=${encodeURIComponent(url)}`;
    const r = (await axios.get(api, { timeout: 30000 })).data;

    const media = r?.data?.[0]?.url || r?.data?.url || r?.download || r?.url;
    if (!media) throw new Error('No pude obtener media de Twitter/X.');

    await sock.sendMessage(chat, { video: { url: media }, caption: '✅ Twitter/X listo.' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error TW/X: ${e?.message || e}` }, { quoted: msg });
  }
};