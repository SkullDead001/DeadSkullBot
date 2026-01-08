const { parseCommand } = require('./_cmd');
const yts = require('yt-search');
const { fetchBuffer } = require('./_net');
const { ytmp3, ytmp4 } = require('@hiudyy/ytdl');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;

  const cmds = ['ytmp4doc', 'ytmp3doc', 'playaudiodoc', 'playvideodoc'];
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
      if (!url) throw new Error('No encontré resultados en YouTube.');
    }

    const isMp4 = p.command.includes('4') || p.command.includes('video');
    const info = isMp4 ? await ytmp4(url) : await ytmp3(url);

    const dlUrl = info?.url || info?.download || info?.dl;
    const title = info?.title || 'youtube';
    if (!dlUrl) throw new Error('No pude obtener el link de descarga.');

    const file = await fetchBuffer(dlUrl);

    await sock.sendMessage(
      chat,
      {
        document: file,
        mimetype: isMp4 ? 'video/mp4' : 'audio/mpeg',
        fileName: isMp4 ? `${title}.mp4` : `${title}.mp3`,
      },
      { quoted: msg }
    );
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error YT Doc: ${e?.message || e}` }, { quoted: msg });
  }
};