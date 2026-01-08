const { parseCommand } = require('./_cmd');
const yts = require('yt-search');
const { fetchBuffer } = require('./_net');
const axios = require('axios');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;
  if (!['play', 'play2'].includes(p.command)) return;

  if (!p.argText) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <búsqueda>` }, { quoted: msg });
    return;
  }

  try {
    const r = await yts(p.argText);
    const v = r?.videos?.[0];
    if (!v?.url) throw new Error('No encontré resultados en YouTube.');

    // Opción simple: usar una API pública (rápido, suele funcionar)
    // Si prefieres 100% local, luego lo cambiamos a ytdl-core.
    const api = `https://delirius-apiofc.vercel.app/download/ytmp3?url=${encodeURIComponent(v.url)}`;
    const dl = (await axios.get(api, { timeout: 30000 })).data;
    const audioUrl = dl?.data?.download || dl?.download || dl?.url;

    if (!audioUrl) throw new Error('No pude obtener el link de descarga (API).');

    const audio = await fetchBuffer(audioUrl);
    await sock.sendMessage(chat, { audio, mimetype: 'audio/mpeg', fileName: `${v.title}.mp3` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error Play: ${e?.message || e}` }, { quoted: msg });
  }
};