const clean = (value, maxLength = 300) => String(value || '').trim().slice(0, maxLength);

export const prepareLifecycleChange = (order, body = {}, now = new Date()) => {
  const action = clean(body.action, 40);

  if (action === 'ship') {
    if (!order.isPaid || order.paymentStatus !== 'paid' || order.fulfillmentStatus !== 'processing') {
      throw Object.assign(new Error('Only paid orders being processed can be marked as shipped'), { status: 409 });
    }
    const carrier = clean(body.carrier, 100);
    const trackingNumber = clean(body.trackingNumber, 120);
    const trackingUrl = clean(body.trackingUrl, 500);
    if (!carrier || !trackingNumber) {
      throw Object.assign(new Error('Carrier and tracking number are required'), { status: 400 });
    }
    if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
      throw Object.assign(new Error('Tracking URL must start with http:// or https://'), { status: 400 });
    }
    return {
      action,
      updates: {
        fulfillmentStatus: 'shipped',
        shippedAt: now,
        tracking: { carrier, trackingNumber, ...(trackingUrl ? { trackingUrl } : {}) },
      },
      note: `Shipped with ${carrier}; tracking ${trackingNumber}`,
    };
  }

  if (action === 'deliver') {
    if (!order.isPaid || order.fulfillmentStatus !== 'shipped') {
      throw Object.assign(new Error('Only shipped orders can be marked as delivered'), { status: 409 });
    }
    return {
      action,
      updates: { fulfillmentStatus: 'delivered', isDelivered: true, deliveredAt: now },
      note: clean(body.note) || 'Marked as delivered',
    };
  }

  if (action === 'cancel') {
    if (order.isPaid || !['pending', 'failed'].includes(order.paymentStatus) || order.fulfillmentStatus !== 'awaiting_payment') {
      throw Object.assign(new Error('Only unpaid orders awaiting payment can be cancelled directly'), { status: 409 });
    }
    return {
      action,
      updates: {
        fulfillmentStatus: 'cancelled',
        cancelledAt: now,
        cancellationReason: clean(body.reason) || 'Cancelled by administrator',
        inventoryRestoredAt: now,
      },
      note: clean(body.reason) || 'Unpaid order cancelled',
      restoreInventory: !order.inventoryRestoredAt,
    };
  }

  if (action === 'record_refund') {
    if (!order.isPaid || order.paymentStatus !== 'paid' || order.fulfillmentStatus !== 'processing') {
      throw Object.assign(new Error('Only paid, unshipped orders can be recorded as refunded'), { status: 409 });
    }
    const providerRefundId = clean(body.providerRefundId, 200);
    const reason = clean(body.reason);
    if (!providerRefundId) {
      throw Object.assign(new Error('The Stripe or PayPal refund reference is required'), { status: 400 });
    }
    return {
      action,
      updates: {
        paymentStatus: 'refunded',
        fulfillmentStatus: 'cancelled',
        cancelledAt: now,
        cancellationReason: reason || 'Refunded before shipment',
        inventoryRestoredAt: now,
        refund: { amount: order.totalPrice, providerRefundId, reason, recordedAt: now },
      },
      note: `Full refund recorded (${providerRefundId})${reason ? `: ${reason}` : ''}`,
      restoreInventory: !order.inventoryRestoredAt,
    };
  }

  throw Object.assign(new Error('Unsupported order lifecycle action'), { status: 400 });
};
