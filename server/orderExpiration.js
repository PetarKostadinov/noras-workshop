import mongoose from 'mongoose';
import Order from './models/orderModel.js';
import Product from './models/productModel.js';
import { getReservationMinutes } from './orderExpirationConfig.js';

export { getReservationExpiry } from './orderExpirationConfig.js';

export const expireOrderReservation = async (orderId, now = new Date()) => {
  let expired = false;

  await mongoose.connection.transaction(async (session) => {
    const order = await Order.findOne({
      _id: orderId,
      isPaid: false,
      paymentStatus: { $in: ['pending', 'failed'] },
      fulfillmentStatus: 'awaiting_payment',
      expiresAt: { $lte: now },
      inventoryRestoredAt: null,
    }).session(session);

    if (!order) return;

    await Product.bulkWrite(order.orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { countMany: item.quantity } },
      },
    })), { session });

    order.paymentStatus = 'expired';
    order.fulfillmentStatus = 'cancelled';
    order.expiredAt = now;
    order.inventoryRestoredAt = now;
    await order.save({ session });
    expired = true;
  });

  return expired;
};

export const expireDueOrders = async (now = new Date()) => {
  const dueOrders = await Order.find({
    isPaid: false,
    paymentStatus: { $in: ['pending', 'failed'] },
    fulfillmentStatus: 'awaiting_payment',
    expiresAt: { $lte: now },
    inventoryRestoredAt: null,
  }).select('_id').limit(100).lean();

  let expiredCount = 0;
  for (const order of dueOrders) {
    if (await expireOrderReservation(order._id, now)) expiredCount += 1;
  }
  return expiredCount;
};

export const backfillOrderExpirations = async () => {
  const durationMs = getReservationMinutes() * 60 * 1000;
  await Order.updateMany(
    { isPaid: false, fulfillmentStatus: 'awaiting_payment', expiresAt: { $exists: false } },
    [{ $set: { expiresAt: { $add: ['$createdAt', durationMs] } } }]
  );
};
