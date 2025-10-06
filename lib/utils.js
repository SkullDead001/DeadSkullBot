/**
 * Verifica si un texto es una URL válida
 * @param {String} text - Texto a verificar
 * @returns {Boolean}
 */
function isUrl(text) {
    if (!text) return false;
    return text.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(jpe?g|gif|png|webp)/gi
    );
}

/**
 * Genera un nombre de archivo único con timestamp
 * @param {String} extension - Extensión del archivo
 * @returns {String}
 */
function generateFileName(extension = 'jpg') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `file_${timestamp}_${random}.${extension}`;
}

module.exports = {
    isUrl,
    generateFileName
};
