const { parseCommand } = require('./_cmd');
const yts = require('yt-search');
const { fetchBuffer } = require('./_net');
const { ytmp3 } = require('@hiudyy/ytdl');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;

  const cmds = ['yta', 'ytmp3', 'audio', 'dlmp3', 'getaud'];
  if (!cmds.includes(p.command)) return;

  if (!p.argText) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <búsqueda o url>` }, { quoted: msg });
    return;
  }

  try {
    let url = p.argText.trim();
    if (!/^https?:\/\//i.test(url)) {
      const r = await yts(url);
      url = r?.videos?.[0]?.url;
      if (!url) throw new Error('No encontré resultados.');
    }

    const info = await ytmp3(url);
    const dlUrl = info?.url || info?.download || info?.dl;
    const title = info?.title || 'youtube';
    if (!dlUrl) throw new Error('No pude obtener el link de descarga.');

    const audio = await fetchBuffer(dlUrl);
    await sock.sendMessage(chat, { audio, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error YTA: ${e?.message || e}` }, { quoted: msg });
  }
};