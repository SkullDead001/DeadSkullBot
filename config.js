// Configuración centralizada para DeadSkull Bot

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
        number: "5211234567890@s.whatsapp.net", // Reemplaza con tu número
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
            maxVideoDuration: 7, // segundos
            quality: 70,
            categories: ['🤩', '🎉']
        },
        
        // Tiempos y límites
        cooldown: 10000, // 10 segundos entre comandos
        maxFileSize: 50, // MB
        readMessages: true,
        readStatus: false,
        
        // Grupos
        allowGroups: true,
        onlyAdmins: true,
        welcomeMessage: true,
        
        // Logs y debug - IMPORTANTE para tu index.js mejorado
        debug: false, // ← Activa/desactiva logs de mensajes
        logLevel: "warn" // ← Nivel de log para Baileys
    },

    // ==========================================
    // MENSAJES PERSONALIZABLES
    // ==========================================
    messages: {
        // Errores y advertencias
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
        // Estado de plugins (true/false)
        sticker: true,
        kick: true,
        menu: true,
        ping: true,
        help: true,
        
        // Configuraciones específicas por plugin
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
        printQRInTerminal: false, // ← Ya lo usa tu index.js
        syncFullHistory: false,
        linkPreviewImageThumbnailWidth: 192,
        generateHighQualityLinkPreview: true,
        
        // Opciones avanzadas de Baileys
        markOnlineOnConnect: true,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 60000,
        
        // Opciones de conexión
        connectTimeoutMs: 30000,
        keepAliveIntervalMs: 15000
    }
};

// ==========================================
// VALIDACIÓN DE CONFIGURACIÓN
// ==========================================

/**
 * Valida la configuración al cargar
 */
function validateConfig() {
    // Validar prefix
    if (!module.exports.bot.prefix || module.exports.bot.prefix.length > 2) {
        console.warn("⚠️  Prefix inválido, usando '.' por defecto");
        module.exports.bot.prefix = ".";
    }
    
    // Validar cooldown
    if (module.exports.options.cooldown < 1000) {
        console.warn("⚠️  Cooldown muy bajo, estableciendo 5000ms mínimo");
        module.exports.options.cooldown = 5000;
    }
    
    // Validar rutas
    if (!fs.existsSync(module.exports.bot.sessionPath)) {
        require('fs').mkdirSync(module.exports.bot.sessionPath, { recursive: true });
    }
    
    if (!fs.existsSync(module.exports.bot.tempPath)) {
        require('fs').mkdirSync(module.exports.bot.tempPath, { recursive: true });
    }
}

// Ejecutar validación al cargar
if (typeof require !== 'undefined' && require.main === module) {
    validateConfig();
} else {
    // Si se importa como módulo, validar también
    const fs = require('fs');
    validateConfig();
}
