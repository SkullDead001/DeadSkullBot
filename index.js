// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const Pino = require('pino');
const fs = require('fs');
const path = require('path');
const logger = Pino({ level: 'warn' });

// --- CARGA DE PLUGINS ---
let plugins = {};
const pluginsPath = path.join(__dirname, 'plugins');

function loadPlugins() {
    fs.readdirSync(pluginsPath).forEach(file => {
        if (file.endsWith('.js')) {
            delete require.cache[require.resolve(path.join(pluginsPath, file))]; // refrescar si recargas
            const plugin = require(path.join(pluginsPath, file));
            plugins[file] = plugin;
            console.log(`✅ Plugin cargado: ${file}`);
        }
    });
}

// --- BOT PRINCIPAL ---
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sesion-guardada');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
    });

    sock.ev.on('creds.update', saveCreds);

    let qrShown = false;
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !qrShown) {
            console.log("🏮 Escanea el código QR 🏮");
            qrcode.generate(qr, { small: true });
            qrShown = true;
        }

        if (connection === 'close') {
            qrShown = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Conectado exitosamente');
        }
    });

    // --- Escuchar mensajes y ejecutar plugins ---
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        for (let file in plugins) {
            try {
                await plugins[file](sock, msg, text, sender);
            } catch (e) {
                console.error(`❌ Error en plugin ${file}:`, e);
            }
        }
    });
}

// Iniciar
loadPlugins();
startBot();