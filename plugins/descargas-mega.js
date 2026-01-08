const { parseCommand } = require('./_cmd');
const { File } = require('megajs');
const mime = require('mime-types');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;
  if (p.command !== 'mega') return;

  const url = p.argText?.trim();
  if (!url) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <url mega.nz>` }, { quoted: msg });
    return;
  }

  try {
    const file = File.fromURL(url);
    await file.loadAttributes();

    const name = file.name || 'mega.bin';
    const ext = name.split('.').pop();
    const mimetype = mime.lookup(ext) || 'application/octet-stream';

    const chunks = [];
    await file.download().each((data) => chunks.push(data));
    const buf = Buffer.concat(chunks);

    await sock.sendMessage(chat, { document: buf, fileName: name, mimetype }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error Mega: ${e?.message || e}` }, { quoted: msg });
  }
};