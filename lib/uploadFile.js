const axios = require('axios');
const FormData = require('form-data');

/**
 * Sube un archivo a telegra.ph
 * @param {Buffer} buffer - Buffer del archivo
 * @returns {String} URL del archivo subido
 */
async function uploadFile(buffer) {
    try {
        const form = new FormData();
        form.append('file', buffer, { filename: 'file.jpg' });
        
        const { data } = await axios.post('https://telegra.ph/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        
        if (data && data[0] && data[0].src) {
            return 'https://telegra.ph' + data[0].src;
        }
        throw new Error('Error subiendo archivo');
    } catch (error) {
        console.error('Error en uploadFile:', error);
        throw error;
    }
}

module.exports = uploadFile;
