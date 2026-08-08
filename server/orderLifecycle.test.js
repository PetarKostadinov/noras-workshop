import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareLifecycleChange } from './orderLifecycle.js';

const now = new Date('2026-08-08T12:00:00.000Z');

test('paid processing orders can be prepared for shipment', () => {
  const change = prepareLifecycleChange(
    { isPaid: true, paymentStatus: 'paid', fulfillmentStatus: 'processing' },
    { action: 'ship', carrier: 'DHL', trackingNumber: 'ABC123', trackingUrl: 'https://example.com/ABC123' },
    now
  );
  assert.equal(change.updates.fulfillmentStatus, 'shipped');
  assert.equal(change.updates.tracking.carrier, 'DHL');
  assert.equal(change.updates.shippedAt, now);
});

test('shipment requires tracking details and a valid transition', () => {
  assert.throws(
    () => prepareLifecycleChange({ isPaid: true, paymentStatus: 'paid', fulfillmentStatus: 'processing' }, { action: 'ship' }),
    /Carrier and tracking number/
  );
  assert.throws(
    () => prepareLifecycleChange({ isPaid: false, paymentStatus: 'pending', fulfillmentStatus: 'awaiting_payment' }, { action: 'ship', carrier: 'DHL', trackingNumber: '1' }),
    /Only paid orders/
  );
});

test('only shipped orders can be delivered', () => {
  const change = prepareLifecycleChange({ isPaid: true, paymentStatus: 'paid', fulfillmentStatus: 'shipped' }, { action: 'deliver' }, now);
  assert.deepEqual(change.updates, { fulfillmentStatus: 'delivered', isDelivered: true, deliveredAt: now });
  assert.throws(() => prepareLifecycleChange({ isPaid: true, fulfillmentStatus: 'processing' }, { action: 'deliver' }), /Only shipped/);
});

test('unpaid cancellation and full refund restore inventory only once', () => {
  const cancellation = prepareLifecycleChange(
    { isPaid: false, paymentStatus: 'pending', fulfillmentStatus: 'awaiting_payment', inventoryRestoredAt: null },
    { action: 'cancel', reason: 'Customer request' },
    now
  );
  assert.equal(cancellation.restoreInventory, true);
  assert.equal(cancellation.updates.fulfillmentStatus, 'cancelled');

  const refund = prepareLifecycleChange(
    { isPaid: true, paymentStatus: 'paid', fulfillmentStatus: 'processing', inventoryRestoredAt: null, totalPrice: 42.5 },
    { action: 'record_refund', providerRefundId: 're_123', reason: 'Damaged before dispatch' },
    now
  );
  assert.equal(refund.updates.paymentStatus, 'refunded');
  assert.equal(refund.updates.refund.amount, 42.5);
  assert.equal(refund.restoreInventory, true);
});

test('refund recording requires an external provider reference', () => {
  assert.throws(
    () => prepareLifecycleChange({ isPaid: true, paymentStatus: 'paid', fulfillmentStatus: 'processing' }, { action: 'record_refund' }),
    /refund reference/
  );
});
