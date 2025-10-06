const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

/**
 * Crea un sticker con metadatos personalizados
 * @param {Buffer} media - Buffer de la imagen/video
 * @param {String} url - URL alternativa
 * @param {String} packname - Nombre del pack
 * @param {String} author - Autor del sticker
 * @returns {Buffer} Buffer del sticker WebP
 */
async function sticker(media, url, packname, author) {
    try {
        const stickerOptions = {
            pack: packname || 'DeadSkull Bot',
            author: author || 'DeadSkull Bot',
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            quality: 70,
            background: 'transparent'
        };

        let stickerBuffer;
        
        if (media) {
            stickerBuffer = await createSticker(media, stickerOptions);
        } else if (url) {
            stickerBuffer = await createSticker(url, stickerOptions);
        } else {
            throw new Error('No se proporcionó media ni URL');
        }

        return stickerBuffer;
    } catch (error) {
        console.error('Error en sticker lib:', error);
        throw error;
    }
}

module.exports = { sticker };
