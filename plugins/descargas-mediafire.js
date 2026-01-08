const { parseCommand } = require('./_cmd');
const fetch = require('node-fetch');

async function extractMediafireDirect(url) {
  const html = await (await fetch(url)).text();
  const m = html.match(/href="(https?:\/\/download[^"]+)"/i) || html.match(/(https?:\/\/download[^\s"'<>]+)/i);
  return m?.[1] || m?.[0] || null;
}

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;
  if (!['mediafire', 'mediafiredl', 'dlmediafire'].includes(p.command)) return;

  const url = p.argText?.trim();
  if (!url) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <url mediafire>` }, { quoted: msg });
    return;
  }

  try {
    const direct = await extractMediafireDirect(url);
    if (!direct) throw new Error('No pude extraer el link directo.');

    await sock.sendMessage(chat, { document: { url: direct }, mimetype: 'application/octet-stream', fileName: 'mediafire.bin' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error Mediafire: ${e?.message || e}` }, { quoted: msg });
  }
};