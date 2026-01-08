const { parseCommand } = require('./_cmd');
const axios = require('axios');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;
  if (!['instagram', 'ig', 'igdl'].includes(p.command)) return;

  const url = p.argText?.trim();
  if (!url) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <url de instagram>` }, { quoted: msg });
    return;
  }

  try {
    // API genérica (cambia seguido; si falla, lo ajustamos a otro endpoint)
    const api = `https://delirius-apiofc.vercel.app/download/igdl?url=${encodeURIComponent(url)}`;
    const r = (await axios.get(api, { timeout: 30000 })).data;

    const items = r?.data || r?.result || [];
    const first = Array.isArray(items) ? items[0] : items;
    const mediaUrl = first?.url || first?.download || first?.link;

    if (!mediaUrl) throw new Error('No pude obtener media de Instagram.');

    // Si es video, se manda como video. Si es imagen, como imagen.
    if (String(mediaUrl).includes('.mp4')) {
      await sock.sendMessage(chat, { video: { url: mediaUrl }, caption: '✅ IG listo.' }, { quoted: msg });
    } else {
      await sock.sendMessage(chat, { image: { url: mediaUrl }, caption: '✅ IG listo.' }, { quoted: msg });
    }
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error IG: ${e?.message || e}` }, { quoted: msg });
  }
};