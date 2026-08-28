import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPaymentParams, generateHash, createPayment } from './cmi.service.js';

test('cmi service: buildPaymentParams builds valid CMI object', () => {
  const params = buildPaymentParams({
    orderId: 'CMD-202608-1001',
    amount: 1500,
    clientId: 'clnt-123456',
    email: 'client@example.ma',
    successUrl: 'http://localhost:5173/success',
    failUrl: 'http://localhost:5173/fail',
    callbackUrl: 'http://localhost:4000/api/payment/callback',
  });

  assert.equal(params.oid, 'CMD-202608-1001');
  assert.equal(params.amount, '1500.00');
  assert.equal(params.currency, 'MAD');
  assert.equal(params.storetype, '3d_pay');
  assert.equal(params.hashalgorithm, 'ver2');
  assert.equal(params.email, 'client@example.ma');
  assert.equal(typeof params.rnd, 'string');
});

test('cmi service: generateHash produces deterministic HMAC signature', () => {
  const params = {
    clientid: 'TEST_MERCHANT_ID',
    oid: 'CMD-123',
    amount: '500.00',
    okurl: 'http://ok',
    failurl: 'http://fail',
    callbackurl: 'http://callback',
    rnd: 'fixed_rnd_value_123',
  };

  const hash1 = generateHash(params);
  const hash2 = generateHash(params);

  assert.equal(typeof hash1, 'string');
  assert.equal(hash1.length > 0, true);
  assert.equal(hash1, hash2);
});

test('cmi service: createPayment returns gatewayUrl and parameters with hash', () => {
  const payment = createPayment({
    orderId: 'CMD-202608-9999',
    amount: 2490.5,
    clientId: 'client-99',
    email: 'test@ernet.ma',
    successUrl: 'http://ok',
    failUrl: 'http://fail',
    callbackUrl: 'http://callback',
  });

  assert.equal(typeof payment.gatewayUrl, 'string');
  assert.equal(payment.params.oid, 'CMD-202608-9999');
  assert.equal(payment.params.amount, '2490.50');
  assert.equal(typeof payment.params.hash, 'string');
  assert.equal(payment.params.hash.length > 0, true);
});

