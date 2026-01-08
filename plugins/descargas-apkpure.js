const { parseCommand } = require('./_cmd');
const axios = require('axios');

const apkpureApi = 'https://apkpure.com/api/v2/search?q=';
const apkpureDownloadApi = 'https://apkpure.com/api/v2/download?id=';

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;
  if (!['apkp', 'apkpure', 'apkdl'].includes(p.command)) return;

  if (!p.argText) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <nombre app>` }, { quoted: msg });
    return;
  }

  try {
    const s = (await axios.get(apkpureApi + encodeURIComponent(p.argText), { timeout: 30000 })).data;
    const app = s?.results?.[0];
    if (!app?.id) throw new Error('No encontré resultados en APKPure.');

    const d = (await axios.get(apkpureDownloadApi + app.id, { timeout: 30000 })).data;
    const dl = d?.url || d?.download || d?.link;
    if (!dl) throw new Error('No pude obtener el link de descarga.');

    await sock.sendMessage(
      chat,
      { document: { url: dl }, mimetype: 'application/vnd.android.package-archive', fileName: `${app?.title || 'app'}.apk` },
      { quoted: msg }
    );
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error APKPure: ${e?.message || e}` }, { quoted: msg });
  }
};