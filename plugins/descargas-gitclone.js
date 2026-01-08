const { parseCommand } = require('./_cmd');

module.exports = async (sock, msg, text, chat) => {
  const p = parseCommand(text);
  if (!p) return;

  const cmds = ['gitclone', 'clonarepo', 'clonarrepo', 'repoclone'];
  if (!cmds.includes(p.command)) return;

  const url = p.argText?.trim();
  if (!url) {
    await sock.sendMessage(chat, { text: `Uso: ${p.prefix}${p.command} <url repo github>` }, { quoted: msg });
    return;
  }

  try {
    const m = url.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (!m) throw new Error('URL de GitHub inválida.');

    const user = m[1];
    const repo = m[2].replace(/\.git$/i, '');
    const zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;

    await sock.sendMessage(
      chat,
      { document: { url: zipUrl }, mimetype: 'application/zip', fileName: `${repo}.zip` },
      { quoted: msg }
    );
  } catch (e) {
    await sock.sendMessage(chat, { text: `❌ Error GitClone: ${e?.message || e}` }, { quoted: msg });
  }
};