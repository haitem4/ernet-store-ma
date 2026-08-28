// ============================================================
// ERNET STORE — Service de paiement CMI (Centre Monétique Maroc)
// Génère le hash HMAC-SHA256 et l'URL de redirection vers la passerelle.
// ============================================================
import crypto from 'crypto';
import env from '../config/env.js';

/**
 * Construit l'objet de paramètres de paiement CMI.
 * @param {object} opts
 * @param {string} opts.orderId - identifiant commande
 * @param {number} opts.amount - montant en MAD
 * @param {string} opts.clientId - identifiant client
 * @param {string} opts.email - email du client
 * @param {string} opts.currency - devise (MAD)
 * @param {string} opts.successUrl - URL de retour succès
 * @param {string} opts.failUrl - URL de retour échec
 * @param {string} opts.callbackUrl - URL de notification serveur
 */
export function buildPaymentParams({
  orderId,
  amount,
  clientId,
  email,
  currency = 'MAD',
  successUrl,
  failUrl,
  callbackUrl,
}) {
  const clientIdNum = clientId.replace(/\D/g, '').slice(0, 20) || '1000000000000000000';
  return {
    clientid: env.cmiMerchantId || '1000000000000000000',
    storetype: '3d_pay',
    hashalgorithm: 'ver2',
    amount: Number(amount).toFixed(2),
    currency: currency,
    oid: orderId,
    lang: 'fr',
    email: email || '',
    clientid_2: clientIdNum,
    okurl: successUrl,
    failurl: failUrl,
    callbackurl: callbackUrl,
    rnd: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
  };
}

/**
 * Calcule le hash HMAC-SHA256 pour signer les paramètres CMI.
 * @param {object} params - paramètres (sans le champ hash)
 */
export function generateHash(params) {
  const raw =
    params.clientid +
    params.oid +
    params.amount +
    params.okurl +
    params.failurl +
    params.callbackurl +
    params.rnd;
  return crypto
    .createHmac('sha256', env.cmiSecretKey || '')
    .update(raw)
    .digest('base64');
}

/**
 * Crée une demande de paiement complète.
 * Retourne l'URL de la passerelle + les champs à poster.
 */
export function createPayment({
  orderId,
  amount,
  clientId,
  email,
  successUrl,
  failUrl,
  callbackUrl,
}) {
  const params = buildPaymentParams({
    orderId,
    amount: Number(amount),
    clientId,
    email,
    successUrl,
    failUrl,
    callbackUrl,
  });
  const hash = generateHash(params);
  return {
    gatewayUrl: env.cmiGatewayUrl,
    params: { ...params, hash },
  };
}

export default { buildPaymentParams, generateHash, createPayment };
