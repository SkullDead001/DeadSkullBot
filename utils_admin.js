// utils_admin.js
// - Mapea el sender @lid al número real usando metadata.participants
// - Compara siempre por número puro (solo dígitos)
// - Funciones listas para usar desde tus plugins

/** Deja solo números (teléfono) */

function digitsOnly(id) {
  if (!id) return '';
  let num = String(id).replace(/[^0-9]/g, '');
  // 💡 Corrige IDs del bot con sufijo 1 (ej: 52144394696501 → 5214439469650)
  if (num.length > 11 && num.endsWith('1')) num = num.slice(0, -1);
  return num;
}

/** Devuelve lista de números (string) de los admins del grupo */
async function getGroupAdminNumbers(sock, groupId) {
  try {
    const meta = await sock.groupMetadata(groupId);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => digitsOnly(p.jid || p.id || p.lid))
      .filter(Boolean);

    console.log(`📋 Admin numbers for ${groupId}:`, admins);
    return admins;
  } catch (e) {
    console.error('❌ getGroupAdminNumbers error:', e);
    return [];
  }
}

/** Mapea cualquier id (jid/id/lid) al NÚMERO REAL usando la metadata */
async function resolveNumberFromAnyId(sock, groupId, anyId) {
  const n = digitsOnly(anyId);
  if (!n) return '';

  try {
    const meta = await sock.groupMetadata(groupId);
    // Si viene @lid, buscamos por lid
    const byLid = meta.participants.find(p => digitsOnly(p.lid) === n);
    if (byLid?.jid) return digitsOnly(byLid.jid);

    // Si ya viene jid o c.us, el digitsOnly ya lo dejó correcto
    // Verificamos que exista en la lista de participantes (no obligatorio, pero ayuda)
    const byJid = meta.participants.find(p => digitsOnly(p.jid || p.id) === n);
    if (byJid) return digitsOnly(byJid.jid || byJid.id);

    // Si no se encontró mapeo, devolvemos n tal cual (último recurso)
    return n;
  } catch (e) {
    console.error('❌ resolveNumberFromAnyId error:', e);
    return n;
  }
}

/** Obtiene el NÚMERO REAL del remitente del mensaje (mapea @lid → jid) */
async function getSenderNumber(sock, groupId, msg) {
  const raw = msg?.key?.participant || msg?.key?.remoteJid || '';
  const resolved = await resolveNumberFromAnyId(sock, groupId, raw);
  console.log(`👤 Sender raw=${raw} → resolved=${resolved}`);
  return resolved;
}

/** ¿El usuario (por número) es admin? */
async function isNumberAdmin(sock, groupId, number) {
  const admins = await getGroupAdminNumbers(sock, groupId);
  const n = digitsOnly(number);
  const ok = admins.includes(n);
  console.log(`🧾 isNumberAdmin(${n}):`, ok);
  return ok;
}

/** ¿El BOT es admin del grupo? */
async function isBotAdmin(sock, groupId) {
  try {
    const botNum = digitsOnly(sock?.user?.id);
    const admins = await getGroupAdminNumbers(sock, groupId);
    const ok = admins.includes(botNum);
    console.log(`🤖 BotNum=${botNum} isAdmin=${ok}`);
    return ok;
  } catch (e) {
    console.error('❌ isBotAdmin error:', e);
    return false;
  }
}

/** Check duro: valida admin del remitente del msg, mapeando lid → jid */
async function checkAdminAndReact(sock, groupId, msg) {
  try {
    if (!groupId?.endsWith('@g.us')) return true;
    const senderNum = await getSenderNumber(sock, groupId, msg);
    const ok = await isNumberAdmin(sock, groupId, senderNum);
    if (!ok) {
      await sock.sendMessage(groupId, { react: { text: '⚠️', key: msg.key } });
      await sock.sendMessage(groupId, { text: 'Solo los administradores pueden usar este comando.' });
    }
    return ok;
  } catch (e) {
    console.error('❌ checkAdminAndReact error:', e);
    return false;
  }
}

module.exports = {
  digitsOnly,
  getGroupAdminNumbers,
  resolveNumberFromAnyId,
  getSenderNumber,
  isNumberAdmin,
  isBotAdmin,
  checkAdminAndReact,
};
