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
    white: '\x1b[37m'
};

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const types = {
        success: `${colors.green}✅${colors.reset}`,
        error: `${colors.red}❌${colors.reset}`,
        warning: `${colors.yellow}⚠️${colors.reset}`,
        info: `${colors.blue}ℹ️${colors.reset}`,
        plugin: `${colors.magenta}🔌${colors.reset}`,
        connection: `${colors.cyan}🔗${colors.reset}`
    };
    
    console.log(`${colors.dim}[${timestamp}]${colors.reset} ${types[type]} ${message}`);
}

// --- BANNER DE INICIO ---
function showBanner() {
    console.log(`${colors.cyan}
    ██████╗ ███████╗ █████╗ ██████╗ ███████╗██╗  ██╗██╗   ██╗██╗     ██╗     
    ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██║   ██║██║     ██║     
    ██║  ██║█████╗  ███████║██║  ██║███████╗█████╔╝ ██║   ██║██║     ██║     
    ██║  ██║██╔══╝  ██╔══██║██║  ██║╚════██║██╔═██╗ ██║   ██║██║     ██║     
    ██████╔╝███████╗██║  ██║██████╔╝███████║██║  ██╗╚██████╔╝███████╗███████╗
    ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝
    ${colors.reset}`);
    console.log(`${colors.yellow}🤖 ${config.bot.name} v${config.bot.version}${colors.reset}`);
    console.log(`${colors.dim}📍 Iniciando bot...${colors.reset}\n`);
}

// --- CARGA DE PLUGINS ---
let plugins = {};
const pluginsPath = path.join(__dirname, 'plugins');

function loadPlugins() {
    log(`Buscando plugins en: ${pluginsPath}`, 'info');
    
    const pluginFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));
    
    if (pluginFiles.length === 0) {
        log('No se encontraron plugins', 'warning');
        return;
    }
    
    pluginFiles.forEach(file => {
        try {
            delete require.cache[require.resolve(path.join(pluginsPath, file))];
            const plugin = require(path.join(pluginsPath, file));
            plugins[file] = plugin;
            log(`Plugin cargado: ${file}`, 'plugin');
        } catch (error) {
            log(`Error cargando plugin ${file}: ${error.message}`, 'error');
        }
    });
    
    log(`Total de plugins cargados: ${Object.keys(plugins).length}`, 'success');
}

// --- BOT PRINCIPAL ---
async function startBot() {
    showBanner();
    
    log('Inicializando sesión de WhatsApp...', 'info');
    const { state, saveCreds } = await useMultiFileAuthState(config.bot.sessionPath);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: config.wa.printQRInTerminal,
        logger: Pino({ level: config.options.logLevel }),
        ...config.wa
    });

    sock.ev.on('creds.update', saveCreds);

    let qrShown = false;
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !qrShown) {
            log(`Generando código QR...`, 'connection');
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
                log(`Conexión perdida. Reconectando en 5 segundos... (Código: ${statusCode})`, 'warning');
                setTimeout(startBot, 5000);
            }
        } else if (connection === 'open') {
            log(`✅ Conectado exitosamente a WhatsApp`, 'success');
            log(`🤖 Bot: ${config.bot.name}`, 'info');
            log(`⚡ Prefix: ${config.bot.prefix}`, 'info');
            log(`🔌 Plugins: ${Object.keys(plugins).length} cargados`, 'info');
        }
    });

    // --- ESCUCHAR MENSAJES MEJORADO ---
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const isGroup = sender.endsWith('@g.us');
        const user = msg.pushName || 'Usuario';

        // Log de mensajes recibidos (opcional)
        if (config.options.debug) {
            const chatType = isGroup ? 'GRUPO' : 'PRIVADO';
            log(`${chatType} <- ${user}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`, 'info');
        }

        // Ejecutar plugins
        for (let file in plugins) {
            try {
                await plugins[file](sock, msg, text, sender);
            } catch (error) {
                log(`Error en plugin ${file}: ${error.message}`, 'error');
            }
        }
    });

    // Manejo de errores global
    process.on('uncaughtException', (error) => {
        log(`Error no capturado: ${error.message}`, 'error');
    });

    process.on('unhandledRejection', (reason, promise) => {
        log(`Promise rechazada no manejada: ${reason}`, 'error');
    });
}

// --- INICIALIZACIÓN ---
loadPlugins();
startBot();
