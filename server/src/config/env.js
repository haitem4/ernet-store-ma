// ============================================================
// ERNET STORE — Configuration des variables d'environnement
// ============================================================
import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  port: process.env.PORT || 4000,
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`,

  databaseUrl: process.env.DATABASE_URL,

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  meilisearchHost: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  meilisearchKey: process.env.MEILISEARCH_MASTER_KEY || 'ernet_master_key',

  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtCookieName: process.env.JWT_COOKIE_NAME || 'ernet_token',

  cmiMerchantId: process.env.CMI_MERCHANT_ID || '1000000000000000000',
  cmiSecretKey: process.env.CMI_SECRET_KEY || 'test_secret_key_cmi',
  cmiGatewayUrl:
    process.env.CMI_GATEWAY_URL || 'https://testpayment.cmi.co.ma/fim/est3Dgate',

  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,

  syncIntervalMs: Number(process.env.SYNC_INTERVAL_MS || 60000),

  // Disway — import automatique des tarifs fournisseur
  diswayLoginUrl:
    process.env.DISWAY_LOGIN_URL || 'https://www.disway.com/profile/login?backurl=%2Fliste-de-prix',
  diswayPriceListUrl: process.env.DISWAY_PRICE_LIST_URL || 'https://www.disway.com/liste-de-prix',
  diswayXlsxUrl: process.env.DISWAY_XLSX_URL,
  diswayXlsxUrls: (process.env.DISWAY_XLSX_URLS || process.env.DISWAY_XLSX_URL || '')
    .split(/[;,\s]+/)
    .filter(Boolean),
  diswayEmail: process.env.DISWAY_EMAIL,
  diswayPassword: process.env.DISWAY_PASSWORD,
  diswayMarkup: Number(process.env.DISWAY_MARKUP || 1.5),
  diswayAutoSync: process.env.DISWAY_AUTO_SYNC === 'true',
  diswayAutoSyncMonthly: process.env.DISWAY_AUTO_SYNC_MONTHLY === 'true',
  diswayAutoSyncTime: process.env.DISWAY_AUTO_SYNC_TIME || '04:00',
  diswaySyncIntervalMs: Number(process.env.DISWAY_SYNC_INTERVAL_MS || 0),
  diswayColSku: process.env.DISWAY_COL_SKU,
  diswayColName: process.env.DISWAY_COL_NAME,
  diswayColPrice: process.env.DISWAY_COL_PRICE,
  diswayColStock: process.env.DISWAY_COL_STOCK,
  diswayColBrand: process.env.DISWAY_COL_BRAND,
  diswayColCategory: process.env.DISWAY_COL_CATEGORY,
  diswayColDescription: process.env.DISWAY_COL_DESCRIPTION,

  // Disway — scraping images
  diswayImageBase: process.env.DISWAY_IMAGE_BASE_URL || 'https://www.disway.com',
  diswayImageSelectors:
    process.env.DISWAY_IMAGE_SELECTORS || 'img.product-image, img[data-src], .product-detail img',
  diswayImageDir: process.env.DISWAY_IMAGE_DIR || 'uploads/products',
  diswayImageConcurrency: Number(process.env.DISWAY_IMAGE_CONCURRENCY || 3),
};

// ============================================================
// Validation de sécurité : refuse de démarrer en production
// avec des secrets par défaut ou manquants.
// ============================================================
if (env.nodeEnv === 'production') {
  const critical = [
    ['DATABASE_URL', env.databaseUrl],
    ['JWT_SECRET', env.jwtSecret],
    ['MEILISEARCH_MASTER_KEY', env.meilisearchKey],
    ['API_URL', env.apiUrl],
    ['CLIENT_URL', env.clientUrl],
  ];
  for (const [name, value] of critical) {
    if (!value || value === 'dev_secret' || value === 'ernet_master_key') {
      throw new Error(
        `❌ Sécurité: la variable ${name} doit être définie et non par défaut en production.`
      );
    }
  }
  if (env.jwtSecret.length < 32) {
    throw new Error('❌ Sécurité: JWT_SECRET doit faire au moins 32 caractères en production.');
  }
  if (!env.cmiMerchantId || !env.cmiSecretKey || !env.cmiGatewayUrl) {
    throw new Error('❌ Sécurité: les variables CMI doivent être définies en production.');
  }
}

export default env;
