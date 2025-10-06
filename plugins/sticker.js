const { sticker } = require('../lib/sticker.js');
const uploadFile = require('../lib/uploadFile.js');
const uploadImage = require('../lib/uploadImage.js');
const { webp2png } = require('../lib/webp2mp4.js');
const { isUrl } = require('../lib/utils.js');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config.js');

// Base de datos simple en memoria
const userDB = new Map();

module.exports = async (sock, msg, text, sender) => {
    // Verificar si el plugin está activado
    if (!config.plugins.sticker) return;
    
    const command = text.split(' ')[0];
    const stickerCommands = [
        config.bot.prefix + 's',
        config.bot.prefix + 'sticker', 
        config.bot.prefix + 'stiker'
    ];
    
    if (!stickerCommands.includes(command)) return;

    // Reacciona con reloj de arena al recibir el comando
    await sock.sendMessage(sender, { react: { text: "⏳", key: msg.key } });

    let stiker = false;
    
    // Obtener datos del usuario
    const user = userDB.get(sender) || { 
        lastmiming: 0, 
        packname: config.options.sticker.packName, 
        author: config.options.sticker.author 
    };
    
    const senderName = msg.pushName || 'Usuario Anónimo';
    let f = user.packname || `${senderName}`;
    let g = user.author || config.bot.name;

    let time = user.lastmiming + config.options.cooldown;
    
    if (Date.now() - user.lastmiming < config.options.cooldown) {
        return await sock.sendMessage(sender, { 
            text: config.messages.cooldown
        }, { quoted: msg });
    }

    try {
        let q = msg;
        let mime = '';
        
        // Detectar tipo de media
        if (msg.message?.imageMessage) mime = 'image';
        else if (msg.message?.videoMessage) mime = 'video';
        else if (msg.message?.stickerMessage) mime = 'webp';
        else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.imageMessage) mime = 'image';
            else if (quoted.videoMessage) mime = 'video';
            else if (quoted.stickerMessage) mime = 'webp';
        }

        if (/webp|image|video/g.test(mime)) {
            if (/video/g.test(mime)) {
                const duration = msg.message?.videoMessage?.seconds || 
                               msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage?.seconds;
                if (duration > config.options.sticker.maxVideoDuration) {
                    return sock.sendMessage(sender, { 
                        text: config.messages.sticker.videoTooLong
                    }, { quoted: msg });
                }
            }

            let img;
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = {
                    key: {
                        remoteJid: sender,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId
                    },
                    message: msg.message.extendedTextMessage.contextInfo.quotedMessage
                };
                img = await downloadMediaMessage(quotedMsg, 'buffer', {});
            } else {
                img = await downloadMediaMessage(msg, 'buffer', {});
            }

            if (!img) {
                return sock.sendMessage(sender, { 
                    text: config.messages.sticker.invalidMedia
                }, { quoted: msg });
            }

            let out;
            try {
                stiker = await sticker(img, false, f, g);
            } catch (e) {
                console.error(e);
            } finally {
                if (!stiker) {
                    if (/webp/g.test(mime)) out = await webp2png(img);
                    else if (/image/g.test(mime)) out = await uploadImage(img);
                    else if (/video/g.test(mime)) out = await uploadFile(img);
                    if (typeof out !== 'string') out = await uploadImage(img);
                    stiker = await sticker(false, out, f, g);
                }
            }
        } else if (text.split(' ')[1]) {
            if (!config.plugins.stickerConfig.allowUrls) {
                return sock.sendMessage(sender, { 
                    text: "❌ Los stickers desde URLs están desactivados"
                });
            }
            
            const url = text.split(' ')[1];
            if (isUrl(url)) {
                stiker = await sticker(false, url, f, g);
            } else {
                return sock.sendMessage(sender, { 
                    text: config.messages.sticker.invalidUrl 
                }, { quoted: msg });
            }
        } else {
            return sock.sendMessage(sender, { 
                text: config.messages.sticker.invalidMedia
            }, { quoted: msg });
        }
    } catch (e) {
        console.error(e);
        if (!stiker) stiker = e;
    } finally {
        if (stiker && Buffer.isBuffer(stiker)) {
            await sock.sendMessage(sender, {
                sticker: stiker
            }, { quoted: msg });
            await sock.sendMessage(sender, { react: { text: "✅", key: msg.key } });
        } else {
            await sock.sendMessage(sender, { 
                text: config.messages.sticker.error
            }, { quoted: msg });
            await sock.sendMessage(sender, { react: { text: "❌", key: msg.key } });
        }
    }
    
    // Actualizar último uso
    user.lastmiming = Date.now();
    userDB.set(sender, user);
};            }
        } else if (text.split(' ')[1]) {
            if (!config.plugins.stickerConfig.allowUrls) {
                return sock.sendMessage(sender, { 
                    text: "❌ Los stickers desde URLs están desactivados"
                });
            }
            
            const url = text.split(' ')[1];
            if (isUrl(url)) {
                stiker = await sticker(false, url, f, g);
            } else {
                return sock.sendMessage(sender, { 
                    text: config.messages.sticker.invalidUrl 
                }, { quoted: msg });
            }
        } else {
            return sock.sendMessage(sender, { 
                text: config.messages.sticker.invalidMedia
            }, { quoted: msg });
        }
    } catch (e) {
        console.error(e);
        if (!stiker) stiker = e;
    } finally {
        if (stiker && Buffer.isBuffer(stiker)) {
            await sock.sendMessage(sender, {
                sticker: stiker
            }, { quoted: msg });
            await sock.sendMessage(sender, { react: { text: "✅", key: msg.key } });
        } else {
            await sock.sendMessage(sender, { 
                text: config.messages.sticker.error
            }, { quoted: msg });
            await sock.sendMessage(sender, { react: { text: "❌", key: msg.key } });
        }
    }
    
    // Actualizar último uso
    user.lastmiming = Date.now();
    userDB.set(sender, user);
};
