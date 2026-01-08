const { parseCommand } = require('./_cmd');
const axios = require('axios');
const cheerio = require('cheerio');

async function searchAptoide(query) {
  const url = `https://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(query)}&limit=1`;
  const r = (await axios.get(url, { timeout: 30000 })).data;
  const app = r?.datalist?.list?.[0];
  if (!app) return null;
  return {
    name: app.name,
    package: app.package,
    version: app.file?.vername,
    size: app.size,
    dl: app.file?.path,
  };
}

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;

  const cmds = ['apkmod', 'modapk', 'aptoide', 'apk'];
  if (!cmds.includes(p.command)) return;

  if (!p.argText) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <nombre app>` }, { quoted: msg });
    return;
  }

  try {
    const app = await searchAptoide(p.argText);
    if (!app?.dl) throw new Error('No encontré la app o no pude obtener descarga.');

    await sock.sendMessage(
      chat,
      {
        document: { url: app.dl },
        mimetype: 'application/vnd.android.package-archive',
        fileName: `${app.name || 'app'}.apk`,
      },
      { quoted: msg }
    );
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error ModAPK/Aptoide: ${e?.message || e}` }, { quoted: msg });
  }
};