import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  signToken,
  generateOrderNumber,
  generateQuoteNumber,
} from './auth.js';
import env from '../config/env.js';

test('auth utils: password hashing and verification', async () => {
  const plain = 'SecretPassword123!';
  const hashed = await hashPassword(plain);

  assert.notEqual(hashed, plain);
  assert.equal(typeof hashed, 'string');

  const isValid = await verifyPassword(plain, hashed);
  assert.equal(isValid, true);

  const isInvalid = await verifyPassword('WrongPassword', hashed);
  assert.equal(isInvalid, false);
});

test('auth utils: JWT token signing and verification', () => {
  const userId = 'user-test-123';
  const role = 'B2B';
  const token = signToken(userId, role);

  assert.equal(typeof token, 'string');
  const decoded = jwt.verify(token, env.jwtSecret);
  assert.equal(decoded.sub, userId);
  assert.equal(decoded.role, role);
});

test('auth utils: unique order and quote numbers generation format', () => {
  const orderNum1 = generateOrderNumber();
  const orderNum2 = generateOrderNumber();
  assert.match(orderNum1, /^CMD-\d{6}-\d{4}$/);
  assert.match(orderNum2, /^CMD-\d{6}-\d{4}$/);

  const quoteNum1 = generateQuoteNumber();
  const quoteNum2 = generateQuoteNumber();
  assert.match(quoteNum1, /^DEV-\d{4}-\d{4}$/);
  assert.match(quoteNum2, /^DEV-\d{4}-\d{4}$/);
});

