import assert from 'node:assert/strict';
import test from 'node:test';
import { getPriceForUser, enrichWithPricing } from './pricing.service.js';

test('pricing service: public / anonymous / B2C gets catalog price', async () => {
  const product = { id: 'p-1', price: 1200, costPrice: 900 };

  const anonPricing = await getPriceForUser(product, null);
  assert.equal(anonPricing.price, 1200);
  assert.equal(anonPricing.isB2B, false);

  const b2cUser = { id: 'u-b2c', role: 'B2C' };
  const b2cPricing = await getPriceForUser(product, b2cUser);
  assert.equal(b2cPricing.price, 1200);
  assert.equal(b2cPricing.isB2B, false);
});

test('pricing service: enrichWithPricing maps multiple products', async () => {
  const products = [
    { id: 'p-1', name: 'Produit 1', price: 500, costPrice: 400 },
    { id: 'p-2', name: 'Produit 2', price: 1500, costPrice: 1200 },
  ];

  const enriched = await enrichWithPricing(products, null);
  assert.equal(enriched.length, 2);
  assert.equal(enriched[0].price, 500);
  assert.equal(enriched[1].price, 1500);
  assert.equal(enriched[0].isB2B, false);
});

