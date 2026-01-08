const { parseCommand } = require('./_cmd');
const { fetchJson, fetchBuffer } = require('./_net');

const SEARCH_API = 'https://delirius-apiofc.vercel.app/search/spotify?q=';
const DL_API = 'https://delirius-apiofc.vercel.app/download/spotifydl?url=';

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;
  if (!['spotify', 'music'].includes(p.command)) return;

  if (!p.argText) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <texto o url>` }, { quoted: msg });
    return;
  }

  try {
    let url = p.argText.trim();
    if (!url.includes('open.spotify.com/')) {
      const s = await fetchJson(SEARCH_API + encodeURIComponent(url));
      const first = s?.data?.[0] || s?.result?.[0] || s?.[0];
      url = first?.url || first?.link;
      if (!url) throw new Error('No encontré resultados en Spotify.');
    }

    const dl = await fetchJson(DL_API + encodeURIComponent(url));
    const info = dl?.data || dl;

    const title = info?.title || 'spotify';
    const audioUrl = info?.download || info?.dl || info?.url || info?.link;
    if (!audioUrl) throw new Error('No pude obtener el enlace de descarga.');

    const audio = await fetchBuffer(audioUrl);

    await sock.sendMessage(
      chat,
      { audio, mimetype: 'audio/mpeg', ptt: false, fileName: `${title}.mp3` },
      { quoted: msg }
    );
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error Spotify: ${e?.message || e}` }, { quoted: msg });
  }
};