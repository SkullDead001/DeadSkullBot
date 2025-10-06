// Configuración centralizada para DeadSkull Bot
const fs = require('fs');

module.exports = {
    // ==========================================
    // INFORMACIÓN BÁSICA DEL BOT
    // ==========================================
    bot: {
        name: "DeadSkull Bot",
        prefix: ".",
        version: "1.0.0",
        author: "DeadSkull",
        sessionPath: "./sesion-guardada",
        tempPath: "./temp"
    },

    // ==========================================
    // PROPIETARIO/DUEÑO DEL BOT
    // ==========================================
    owner: {
        number: "5211234567890@s.whatsapp.net",
        name: "DeadSkull"
    },

    // ==========================================
    // OPCIONES DE FUNCIONALIDADES
    // ==========================================
    options: {
        // Stickers
        sticker: {
            packName: "DeadSkull Pack",
            author: "DeadSkull Bot",
            maxVideoDuration: 7,
            quality: 70,
            categories: ['🤩', '🎉']
        },
        
        // Tiempos y límites
        cooldown: 10000,
        maxFileSize: 50,
        readMessages: true,
        readStatus: false,
        
        // Grupos
        allowGroups: true,
        onlyAdmins: true,
        welcomeMessage: true,
        
        // Logs y debug
        debug: false,
        logLevel: "warn"
    },

    // ==========================================
    // MENSAJES PERSONALIZABLES
    // ==========================================
    messages: {
        cooldown: "🕐 *ESPERA 10 SEGUNDOS* para usar otro comando",
        adminOnly: "⚠️ *SOLO ADMINISTRADORES* pueden usar este comando",
        botAdmin: "🤖 *NECESITO SER ADMINISTRADOR* para esta acción",
        groupOnly: "🚫 *ESTE COMANDO SOLO FUNCIONA EN GRUPOS*",
        
        // Stickers
        sticker: {
            processing: "⏳ *CREANDO STICKER...*",
            success: "✅ *STICKER CREADO*",
            error: "❌ *ERROR CREANDO STICKER*",
            invalidMedia: "📸 *RESPONDE A UNA IMAGEN, VIDEO O GIF*",
            videoTooLong: "⏰ *EL VIDEO NO DEBE DURAR MÁS DE 7 SEGUNDOS*",
            invalidUrl: "🔗 *URL INVÁLIDA*"
        },
        
        // Kick/Admin
        kick: {
            success: "👢 *USUARIO EXPULSADO*",
            error: "❌ *NO PUDE EXPULSAR AL USUARIO*",
            noMention: "❗ *MENCIÓN A UN USUARIO* para expulsar",
            selfKick: "😂 *NO PUEDES EXPULSARTE A TI MISMO*"
        },
        
        // General
        welcome: "👋 *BIENVENIDO AL GRUPO*",
        menu: "🎮 *DEADSKULL BOT - MENÚ*"
    },

    // ==========================================
    // CONFIGURACIÓN DE PLUGINS
    // ==========================================
    plugins: {
        sticker: true,
        kick: true,
        menu: true,
        ping: true,
        help: true,
        
        stickerConfig: {
            useWebp: true,
            allowGifs: true,
            allowUrls: true
        },
        
        adminConfig: {
            allowDemote: false,
            allowPromote: false,
            logActions: true
        }
    },

    // ==========================================
    // APIS Y SERVICIOS EXTERNOS
    // ==========================================
    apis: {
        telegraph: "https://telegra.ph/upload"
    },

    // ==========================================
    // RUTAS DE ARCHIVOS
    // ==========================================
    paths: {
        plugins: "./plugins",
        lib: "./lib",
        utils: "./utils",
        temp: "./temp",
        session: "./sesion-guardada"
    },

    // ==========================================
    // CONFIGURACIÓN DE BAILEYS (WHATSAPP)
    // ==========================================
    wa: {
        printQRInTerminal: false,
        syncFullHistory: false,
        linkPreviewImageThumbnailWidth: 192,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 60000
    }
};

// ==========================================
// FUNCIONES DE CONFIGURACIÓN
// ==========================================

function validateConfig() {
    if (!module.exports.bot.prefix) {
        console.warn("⚠️  No se configuró prefix, usando '.' por defecto");
        module.exports.bot.prefix = ".";
    }
    
    if (module.exports.options.cooldown < 1000) {
        console.warn("⚠️  Cooldown muy bajo, estableciendo 5000ms mínimo");
        module.exports.options.cooldown = 5000;
    }

    if (!fs.existsSync(module.exports.bot.sessionPath)) {
        fs.mkdirSync(module.exports.bot.sessionPath, { recursive: true });
    }
    
    if (!fs.existsSync(module.exports.bot.tempPath)) {
        fs.mkdirSync(module.exports.bot.tempPath, { recursive: true });
    }
}

validateConfig();
