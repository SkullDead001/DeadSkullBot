module.exports = async (sock, msg, text, sender) => {
    if (text === '.p') {
        const start = Date.now(); // Tiempo inicial
        await sock.sendMessage(sender, { text: '🏓 Pong!' });
        const latency = Date.now() - start; // Diferencia de tiempo
        await sock.sendMessage(sender, { text: `⏱ Latencia aproximada: ${latency}ms` });
    }
};
