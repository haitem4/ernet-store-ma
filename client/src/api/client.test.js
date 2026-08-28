import assert from 'node:assert/strict';
import test from 'node:test';
import {
  productsApi,
  categoriesApi,
  brandsApi,
  cartApi,
  ordersApi,
  authApi,
  userApi,
  quotesApi,
  adminApi,
} from './client.js';

test('client api: all service modules are properly exported', () => {
  assert.equal(typeof productsApi.list, 'function');
  assert.equal(typeof productsApi.get, 'function');
  assert.equal(typeof productsApi.meta, 'function');

  assert.equal(typeof categoriesApi.list, 'function');
  assert.equal(typeof brandsApi.list, 'function');

  assert.equal(typeof cartApi.get, 'function');
  assert.equal(typeof cartApi.add, 'function');
  assert.equal(typeof cartApi.update, 'function');
  assert.equal(typeof cartApi.remove, 'function');
  assert.equal(typeof cartApi.clear, 'function');

  assert.equal(typeof ordersApi.list, 'function');
  assert.equal(typeof ordersApi.create, 'function');
  assert.equal(typeof quotesApi.list, 'function');
  assert.equal(typeof quotesApi.create, 'function');

  assert.equal(typeof authApi.login, 'function');
  assert.equal(typeof authApi.register, 'function');
  assert.equal(typeof authApi.me, 'function');
  assert.equal(typeof authApi.logout, 'function');

  assert.equal(typeof userApi.getProfile, 'function');
  assert.equal(typeof userApi.updateProfile, 'function');
  assert.equal(typeof userApi.updatePassword, 'function');
  assert.equal(typeof userApi.addresses.list, 'function');
  assert.equal(typeof userApi.wishlist.list, 'function');
  assert.equal(typeof userApi.notifications.list, 'function');

  assert.equal(typeof adminApi.stats.dashboard, 'function');
  assert.equal(typeof adminApi.syncDisway, 'function');
});
