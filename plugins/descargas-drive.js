const { parseCommand } = require('./_cmd');
const fetch = require('node-fetch');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;
  if (!['drive', 'drivedl', 'gdrive', 'dldrive'].includes(p.command)) return;

  const url = p.argText?.trim();
  if (!url) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <url de Google Drive>` }, { quoted: msg });
    return;
  }

  try {
    // Extrae id
    const m = url.match(/\/d\/([^/]+)|id=([^&]+)/);
    const id = m?.[1] || m?.[2];
    if (!id) throw new Error('No pude extraer el ID de Drive.');

    const dlUrl = `https://drive.google.com/uc?id=${id}&authuser=0&export=download`;

    const res = await fetch(dlUrl);
    if (!res.ok) throw new Error(`Drive respondió ${res.status}`);

    const buf = Buffer.from(await res.arrayBuffer());
    const fileName = `drive_${id}.bin`;

    await sock.sendMessage(chat, { document: buf, fileName, mimetype: 'application/octet-stream' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error Drive: ${e?.message || e}` }, { quoted: msg });
  }
};