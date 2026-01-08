const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

// --- LOGGER MEJORADO ---
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[OK]${colors.reset}`,
    warning: `${colors.yellow}[WARN]${colors.reset}`,
    error: `${colors.red}[ERR]${colors.reset}`,
    plugin: `${colors.magenta}[PLUG]${colors.reset}`,
  }[type] || `${colors.blue}[INFO]${colors.reset}`;

  console.log(`${colors.dim}${timestamp}${colors.reset} ${prefix} ${message}`);
}

function showBanner() {
  console.clear();
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔══════════════════════════════════╗');
  console.log('║         DeadSkullBot 🤖          ║');
  console.log('╚══════════════════════════════════╝');
  console.log(`${colors.reset}`);
}

// --- PLUGINS ---
const plugins = {};
const pluginsPath = path.join(__dirname, 'plugins');

function loadPlugins() {
  log(`Buscando plugins en: ${pluginsPath}`, 'info');

  if (!fs.existsSync(pluginsPath)) {
    log('La carpeta plugins no existe. Creándola...', 'warning');
    fs.mkdirSync(pluginsPath, { recursive: true });
  }

  const pluginFiles = fs.readdirSync(pluginsPath).filter((file) => file.endsWith('.js'));

  if (pluginFiles.length === 0) {
    log('No se encontraron plugins', 'warning');
    return;
  }

  pluginFiles.forEach((file) => {
    try {
      delete require.cache[require.resolve(path.join(pluginsPath, file))];
      const plugin = require(path.join(pluginsPath, file));
      plugins[file] = plugin;
      log(`Plugin cargado: ${file}`, 'plugin');
    } catch (error) {
      log(`Error cargando plugin ${file}: ${error.message}`, 'error');
    }
  });

  log(`Plugins cargados: ${Object.keys(plugins).length}`, 'success');
}

// --- TEXT EXTRACTOR ROBUSTO ---
// (para que funcionen bien los plugins de descarga y grupo)
function getTextFromMessage(msg) {
  const m = msg?.message;
  if (!m) return '';

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    ''
  );
}

// --- MUTE GROUPS (sin DB, en memoria) ---
// Tu plugin grupo-mute.js usará esto.
global.mutedGroups = global.mutedGroups || new Set();

// Devuelve true si se debe ignorar el mensaje por mute
function shouldIgnoreBecauseMuted(chat, text) {
  if (!chat?.endsWith('@g.us')) return false;
  if (!global.mutedGroups?.has(chat)) return false;

  const prefix = (config?.bot?.prefix ?? '.').toString();
  const t = (text || '').trim().toLowerCase();

  // Permitimos comandos de desmute aunque el grupo esté muteado
  const allow =
    t === `${prefix}unmute` ||
    t.startsWith(`${prefix}unmute `) ||
    t === `${prefix}desmutear` ||
    t.startsWith(`${prefix}desmutear `);

  return !allow;
}

// --- BOT ---
async function startBot() {
  showBanner();

  log('Inicializando sesión de WhatsApp...', 'info');
  const { state, saveCreds } = await useMultiFileAuthState(config.bot.sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: config.wa.printQRInTerminal,
    logger: Pino({ level: config.options.logLevel }),
    ...config.wa,
  });

  sock.ev.on('creds.update', saveCreds);

  let qrShown = false;

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !qrShown) {
      log('Generando QR...', 'info');
      console.log(`\n${colors.green}╔══════════════════════════════════╗`);
      console.log(`║           ${colors.cyan}ESCANEA EL QR${colors.green}           ║`);
      console.log(`╚══════════════════════════════════╝${colors.reset}\n`);
      qrcode.generate(qr, { small: true });
      qrShown = true;
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      qrShown = false;

      if (statusCode === DisconnectReason.loggedOut) {
        log('Sesión cerrada. Elimina la carpeta de sesión para reconectar.', 'error');
        process.exit(1);
      } else {
        log(`Conexión cerrada (status: ${statusCode}). Reintentando...`, 'warning');
        startBot().catch((e) => log(`Error reintentando: ${e.message}`, 'error'));
      }
    } else if (connection === 'open') {
      log(`✅ Conectado exitosamente a WhatsApp`, 'success');
      log(`🤖 Bot: ${config.bot.name}`, 'info');
      log(`⚡ Prefix: ${config.bot.prefix}`, 'info');
      log(`🔌 Plugins: ${Object.keys(plugins).length} cargados`, 'info');
    }
  });

  // --- ESCUCHAR MENSAJES ---
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg?.message) return;
    if (msg.key?.fromMe) return; // opcional: evita procesar tus propios mensajes

    const chat = msg.key.remoteJid;
    const text = getTextFromMessage(msg);
    const isGroup = chat.endsWith('@g.us');
    const user = msg.pushName || 'Usuario';

    if (config.options.debug) {
      const chatType = isGroup ? 'GRUPO' : 'PRIVADO';
      log(`${chatType} <- ${user}: ${text.substring(0, 70)}${text.length > 70 ? '...' : ''}`, 'info');
    }

    // MUTE: ignora si el grupo está muteado (excepto unmute/desmutear)
    if (shouldIgnoreBecauseMuted(chat, text)) return;

    // Ejecutar plugins
    for (const file in plugins) {
      try {
        await plugins[file](sock, msg, text, chat);
      } catch (error) {
        log(`Error en plugin ${file}: ${error.message}`, 'error');
      }
    }
  });

  // Manejo de errores global
  process.on('uncaughtException', (error) => {
    log(`Error no capturado: ${error.message}`, 'error');
  });

  process.on('unhandledRejection', (reason) => {
    log(`Promise rechazada no manejada: ${reason}`, 'error');
  });
}

// --- INICIALIZACIÓN ---
loadPlugins();
startBot().catch((e) => log(`Fallo al iniciar: ${e.message}`, 'error'));