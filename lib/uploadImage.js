const axios = require('axios');
const FormData = require('form-data');

/**
 * Sube una imagen a telegra.ph
 * @param {Buffer} buffer - Buffer de la imagen
 * @returns {String} URL de la imagen subida
 */
async function uploadImage(buffer) {
    try {
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg' });
        
        const { data } = await axios.post('https://telegra.ph/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        
        if (data && data[0] && data[0].src) {
            return 'https://telegra.ph' + data[0].src;
        }
        throw new Error('Error subiendo imagen');
    } catch (error) {
        console.error('Error en uploadImage:', error);
        throw error;
    }
}

module.exports = uploadImage;
