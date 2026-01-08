// utils_admin.js (robusto)
// - Usa JIDs reales (@s.whatsapp.net / @g.us) para checks de admin
// - Evita hacks de "solo dígitos" (eso rompe admins)
// - Soporta @lid (best-effort) intentando resolver desde metadata.participants
// - Incluye funciones compatibles con tus plugins: normalizeId, isAdmin, isBotAdmin, checkAdminAndReact

const config = require('./config.js');

/** Quita sufijo de dispositivo ":1" y normaliza a string */
function stripDevice(jid) {
  if (!jid) return '';
  return String(jid).split(':')[0];
}

/**
 * Normaliza un "id" a un JID comparable.
 * - Si ya viene con @ (jid), lo devuelve sin sufijo :device
 * - Si viene como número (solo dígitos), lo convierte a @s.whatsapp.net
 */
function normalizeId(id) {
  if (!id) return '';
  const s = stripDevice(String(id).trim());

  // ya es jid
  if (s.includes('@')) return s;

  // parece número
  const digits = s.replace(/\D/g, '');
  if (!digits) return s;

  return `${digits}@s.whatsapp.net`;
}

/** Obtiene metadata del grupo de forma segura */
async function getGroupMetadataSafe(sock, groupId) {
  try {
    return await sock.groupMetadata(groupId);
  } catch (e) {
    console.error('❌ No pude obtener groupMetadata:', e?.message || e);
    return null;
  }
}

/**
 * Intenta resolver un sender @lid a su jid real @s.whatsapp.net usando participants.
 * Nota: la estructura exacta puede variar por versión de Baileys, así que es best-effort.
 */
function resolveLidToJid(participants, maybeLidJid) {
  const target = normalizeId(maybeLidJid);
  if (!target.endsWith('@lid')) return target;

  const targetCore = stripDevice(target);

  for (const p of participants || []) {
    const pid = normalizeId(p?.id || p?.jid);
    const plid = normalizeId(p?.lid);

    // Si el participant trae lid y coincide, regresamos su id real
    if (plid && stripDevice(plid) === targetCore) return pid;

    // En algunos casos el id puede venir como @lid directamente
    if (pid && stripDevice(pid) === targetCore) return pid;
  }

  // Si no se pudo resolver, devolvemos el @lid (igual sirve para comparar si todos vienen @lid)
  return target;
}

/** Devuelve Set de admins (JIDs) */
function getAdminSetFromMetadata(metadata) {
  const set = new Set();
  const parts = metadata?.participants || [];
  for (const p of parts) {
    if (p?.admin) {
      const jid = normalizeId(p?.id || p?.jid);
      if (jid) set.add(jid);
    }
  }
  return set;
}

/**
 * isAdmin(sock, groupId, userId)
 * - userId puede ser msg.key.participant, sender, número, @lid, etc.
 */
async function isAdmin(sock, groupId, userId) {
  const meta = await getGroupMetadataSafe(sock, groupId);
  if (!meta) return false;

  const parts = meta.participants || [];
  const adminSet = getAdminSetFromMetadata(meta);

  // Resolver userId si viene @lid
  const resolvedUser = resolveLidToJid(parts, userId);
  return adminSet.has(normalizeId(resolvedUser));
}

/** Verifica si el bot es admin en el grupo */
async function isBotAdmin(sock, groupId) {
  const meta = await getGroupMetadataSafe(sock, groupId);
  if (!meta) return false;

  const parts = meta.participants || [];
  const adminSet = getAdminSetFromMetadata(meta);

  const botJid = normalizeId(sock?.user?.id);
  const resolvedBot = resolveLidToJid(parts, botJid);

  return adminSet.has(normalizeId(resolvedBot));
}

/**
 * checkAdminAndReact(sock, groupId, msg)
 * - Devuelve true si el usuario que envió msg es admin.
 * - Si no es admin, manda mensaje y reacciona con ❌.
 */
async function checkAdminAndReact(sock, groupId, msg) {
  try {
    const senderJidRaw = msg?.key?.participant || msg?.key?.remoteJid;
    const ok = await isAdmin(sock, groupId, senderJidRaw);

    if (ok) return true;

    // Mensaje de "solo admin"
    await sock.sendMessage(groupId, { text: config?.messages?.adminOnly || '⚠️ Solo admins.' });

    // Reacción (si el cliente la soporta)
    if (msg?.key) {
      await sock.sendMessage(groupId, { react: { text: '❌', key: msg.key } });
    }

    return false;
  } catch (e) {
    console.error('❌ checkAdminAndReact error:', e?.message || e);
    return false;
  }
}

module.exports = {
  // compatibilidad con tus plugins
  normalizeId,
  isAdmin,
  isBotAdmin,
  checkAdminAndReact,

  // helpers (por si los quieres usar en el futuro)
  stripDevice,
  getGroupMetadataSafe,
};