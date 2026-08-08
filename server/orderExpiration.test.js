import assert from 'node:assert/strict';
import test from 'node:test';
import { getReservationExpiry, getReservationMinutes } from './orderExpirationConfig.js';

test('order reservation duration defaults to 60 minutes', () => {
  const previousValue = process.env.ORDER_RESERVATION_MINUTES;
  delete process.env.ORDER_RESERVATION_MINUTES;
  assert.equal(getReservationMinutes(), 60);
  if (previousValue === undefined) delete process.env.ORDER_RESERVATION_MINUTES;
  else process.env.ORDER_RESERVATION_MINUTES = previousValue;
});

test('order reservation duration is clamped to safe Stripe limits', () => {
  const previousValue = process.env.ORDER_RESERVATION_MINUTES;
  process.env.ORDER_RESERVATION_MINUTES = '5';
  assert.equal(getReservationMinutes(), 31);
  process.env.ORDER_RESERVATION_MINUTES = '99999';
  assert.equal(getReservationMinutes(), 1440);
  if (previousValue === undefined) delete process.env.ORDER_RESERVATION_MINUTES;
  else process.env.ORDER_RESERVATION_MINUTES = previousValue;
});

test('reservation expiry is calculated from the supplied time', () => {
  const previousValue = process.env.ORDER_RESERVATION_MINUTES;
  process.env.ORDER_RESERVATION_MINUTES = '60';
  const start = new Date('2026-08-08T12:00:00.000Z');
  assert.equal(getReservationExpiry(start).toISOString(), '2026-08-08T13:00:00.000Z');
  if (previousValue === undefined) delete process.env.ORDER_RESERVATION_MINUTES;
  else process.env.ORDER_RESERVATION_MINUTES = previousValue;
});
