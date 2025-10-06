// Manejador avanzado de plugins para DeadSkull Bot
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

class PluginHandler {
    constructor() {
        this.plugins = new Map();
        this.utils = {
            admin: require('./utils_admin'),
            lib: require('./lib/sticker'),
            helpers: require('./lib/utils')
        };
        this.stats = {
            loaded: 0,
            errors: 0,
            executed: 0
        };
    }

    /**
     * Carga todos los plugins de la carpeta plugins/
     */
    loadAllPlugins() {
        console.log('🔧 Cargando plugins...');
        
        const pluginFiles = fs.readdirSync(config.paths.plugins)
            .filter(file => file.endsWith('.js'));

        pluginFiles.forEach(file => {
            this.loadPlugin(file);
        });

        console.log(`✅ Plugins cargados: ${this.stats.loaded}/${pluginFiles.length}`);
        if (this.stats.errors > 0) {
            console.log(`❌ Errores: ${this.stats.errors}`);
        }
    }

    /**
     * Carga un plugin individual
     */
    loadPlugin(filename) {
        try {
            const pluginPath = path.join(config.paths.plugins, filename);
            const pluginName = path.basename(filename, '.js');
            
            // Verificar si el plugin está activado en config
            if (config.plugins[pluginName] === false) {
                console.log(`⏸️  Plugin desactivado: ${pluginName}`);
                return;
            }

            // Cargar el plugin
            delete require.cache[require.resolve(pluginPath)];
            const plugin = require(pluginPath);
            
            if (typeof plugin === 'function') {
                this.plugins.set(pluginName, plugin);
                this.stats.loaded++;
                console.log(`✅ Plugin cargado: ${pluginName}`);
            } else {
                throw new Error('El plugin no exporta una función válida');
            }
            
        } catch (error) {
            this.stats.errors++;
            console.error(`❌ Error cargando ${filename}:`, error.message);
        }
    }

    /**
     * Recarga un plugin específico
     */
    reloadPlugin(pluginName) {
        const filename = `${pluginName}.js`;
        if (this.plugins.has(pluginName)) {
            this.plugins.delete(pluginName);
            this.stats.loaded--;
        }
        this.loadPlugin(filename);
    }

    /**
     * Ejecuta un comando específico
     */
    async executeCommand(sock, msg, text, sender, commandName) {
        try {
            const plugin = this.plugins.get(commandName);
            if (!plugin) {
                if (config.options.debug) {
                    console.log(`❌ Plugin no encontrado: ${commandName}`);
                }
                return false;
            }

            // Verificar cooldown global
            if (this.isOnCooldown(sender)) {
                if (config.options.debug) {
                    console.log(`⏳ Cooldown activo para: ${sender}`);
                }
                return false;
            }

            // Ejecutar el plugin
            await plugin(sock, msg, text, sender, this.utils);
            this.stats.executed++;
            
            // Aplicar cooldown
            this.applyCooldown(sender);
            
            return true;

        } catch (error) {
            console.error(`❌ Error ejecutando ${commandName}:`, error);
            return false;
        }
    }

    /**
     * Ejecuta todos los plugins para un mensaje (modo legacy)
     */
    async executeAllPlugins(sock, msg, text, sender) {
        for (let [pluginName, plugin] of this.plugins) {
            try {
                await plugin(sock, msg, text, sender, this.utils);
            } catch (error) {
                console.error(`❌ Error en plugin ${pluginName}:`, error);
            }
        }
    }

    /**
     * Sistema de cooldown por usuario
     */
    isOnCooldown(userId) {
        const lastExecution = this.cooldowns?.get(userId);
        if (!lastExecution) return false;
        
        return (Date.now() - lastExecution) < config.options.cooldown;
    }

    applyCooldown(userId) {
        if (!this.cooldowns) this.cooldowns = new Map();
        this.cooldowns.set(userId, Date.now());
    }

    /**
     * Obtiene estadísticas del handler
     */
    getStats() {
        return {
            ...this.stats,
            totalPlugins: this.plugins.size,
            activePlugins: Array.from(this.plugins.keys())
        };
    }

    /**
     * Lista todos los plugins disponibles
     */
    listPlugins() {
        return Array.from(this.plugins.keys()).map(pluginName => ({
            name: pluginName,
            enabled: config.plugins[pluginName] !== false,
            commands: this.getPluginCommands(pluginName)
        }));
    }

    /**
     * Obtiene los comandos de un plugin (basado en config)
     */
    getPluginCommands(pluginName) {
        const commandMap = {
            sticker: ['.s', '.sticker', '.stiker'],
            kick: ['.kick'],
            menu: ['.menu'],
            ping: ['.ping'],
            help: ['.help']
        };
        return commandMap[pluginName] || [`${config.bot.prefix}${pluginName}`];
    }
}

module.exports = PluginHandler;
