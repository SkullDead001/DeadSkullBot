const fs = require('fs');
const path = require('path');
const config = require('../config.js');

class Logger {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
        
        this.icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            debug: '🐛'
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleString();
        const color = this.getColor(type);
        const icon = this.icons[type] || '📝';
        
        const logMessage = `[${timestamp}] ${icon} ${message}`;
        const coloredMessage = `${color}${logMessage}${this.colors.reset}`;
        
        console.log(coloredMessage);
        this.writeToFile(logMessage);
    }

    getColor(type) {
        const colorMap = {
            success: this.colors.green,
            error: this.colors.red,
            warning: this.colors.yellow,
            info: this.colors.blue,
            debug: this.colors.magenta
        };
        return colorMap[type] || this.colors.white;
    }

    writeToFile(message) {
        if (!config.options.debug) return;
        
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, message + '\n');
    }

    // Métodos rápidos
    success(message) { this.log(message, 'success'); }
    error(message) { this.log(message, 'error'); }
    warn(message) { this.log(message, 'warning'); }
    info(message) { this.log(message, 'info'); }
    debug(message) { this.log(message, 'debug'); }
}

module.exports = new Logger();
