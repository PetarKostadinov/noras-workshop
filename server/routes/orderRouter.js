import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import { auth } from '../utils.js';

const orderRouter = express.Router();
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const restoreInventory = async (reservedItems) => {
    if (reservedItems.length === 0) return;
    await Product.bulkWrite(reservedItems.map(({ productId, quantity }) => ({
        updateOne: {
            filter: { _id: productId },
            update: { $inc: { countMany: quantity } },
        },
    })));
};

const getOwnedOrder = async (orderId, user) => {
    if (!mongoose.isValidObjectId(orderId)) return null;
    const filter = user.isAdmin ? { _id: orderId } : { _id: orderId, user: user._id };
    return Order.findOne(filter);
};

const getPayPalBaseUrl = () => process.env.PAYPAL_ENVIRONMENT === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('PayPal server credentials are not configured');
    }

    const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Unable to authenticate with PayPal');
    return data.access_token;
};

const paypalRequest = async (path, options = {}) => {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    const data = await response.json();
    if (!response.ok) {
        const message = data.details?.[0]?.description || data.message || 'PayPal request failed';
        throw new Error(message);
    }
    return data;
};

const applyPayPalCapture = async (order, paypalOrder) => {
    const capturedPayment = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedAmount = Number(capturedPayment?.amount?.value);
    const hasValidAmount = capturedPayment
        && capturedPayment.amount?.currency_code === 'USD'
        && capturedAmount === order.totalPrice;

    if (!hasValidAmount) {
        order.paymentStatus = 'failed';
        await order.save();
        return { verified: false, pending: false };
    }

    order.paymentResult = {
        id: capturedPayment.id,
        status: capturedPayment.status,
        update_time: capturedPayment.update_time,
        email_address: paypalOrder.payer?.email_address,
    };

    if (paypalOrder.status === 'COMPLETED' && capturedPayment.status === 'COMPLETED') {
        order.isPaid = true;
        order.paidAt = new Date(capturedPayment.create_time || Date.now());
        order.paymentStatus = 'paid';
        order.fulfillmentStatus = 'processing';
        await order.save();
        return { verified: true, pending: false };
    }

    if (capturedPayment.status === 'PENDING') {
        order.paymentStatus = 'processing';
        order.fulfillmentStatus = 'awaiting_payment';
        await order.save();
        return { verified: true, pending: true };
    }

    order.paymentStatus = 'failed';
    await order.save();
    return { verified: false, pending: false };
};

orderRouter.post('/', auth, expressAsyncHandler(async (req, res) => {
    const requestedItems = Array.isArray(req.body.orderItems) ? req.body.orderItems : [];
    if (requestedItems.length === 0) {
        return res.status(400).send({ message: 'Your cart is empty' });
    }

    const quantities = new Map();
    for (const item of requestedItems) {
        const productId = item._id || item.product;
        const quantity = Number(item.quantity);
        if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).send({ message: 'The cart contains an invalid item' });
        }
        quantities.set(String(productId), (quantities.get(String(productId)) || 0) + quantity);
    }

    const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
    if (products.length !== quantities.size) {
        return res.status(400).send({ message: 'One or more products are no longer available' });
    }

    const orderItems = products.map((product) => ({
            product: product._id,
            slug: product.slug,
            name: product.name,
            quantity: quantities.get(String(product._id)),
            image: product.image,
            price: product.price,
        }));

    const itemsPrice = roundMoney(orderItems.reduce((total, item) => total + item.price * item.quantity, 0));
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const taxPrice = roundMoney(itemsPrice * 0.15);
    const totalPrice = roundMoney(itemsPrice + shippingPrice + taxPrice);

    const reservedItems = [];
    try {
        for (const product of products) {
            const quantity = quantities.get(String(product._id));
            const reservation = await Product.updateOne(
                { _id: product._id, countMany: { $gte: quantity } },
                { $inc: { countMany: -quantity } }
            );
            if (reservation.modifiedCount !== 1) {
                const stockError = new Error(`“${product.name}” no longer has enough stock for this order`);
                stockError.status = 409;
                throw stockError;
            }
            reservedItems.push({ productId: product._id, quantity });
        }

        const newOrder = new Order({
            orderItems,
            shippingInfo: req.body.shippingInfo,
            paymentMethod: 'PayPal',
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            user: req.user._id,
            paymentStatus: 'pending',
            fulfillmentStatus: 'awaiting_payment',
        });
        const order = await newOrder.save();
        res.status(201).send({ message: 'Order created and awaiting payment', order });
    } catch (error) {
        await restoreInventory(reservedItems);
        if (error.status === 409) {
            return res.status(409).send({ message: error.message });
        }
        throw error;
    }
}));

orderRouter.get('/mine', auth, expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.send(orders);
}));

orderRouter.get('/:id', auth, expressAsyncHandler(async (req, res) => {
    const order = await getOwnedOrder(req.params.id, req.user);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    res.send(order);
}));

orderRouter.post('/:id/paypal-order', auth, expressAsyncHandler(async (req, res) => {
    const order = await getOwnedOrder(req.params.id, req.user);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.isPaid) return res.status(400).send({ message: 'This order is already paid' });
    if (order.paymentMethod !== 'PayPal') return res.status(400).send({ message: 'PayPal is not selected for this order' });

    const paypalOrder = await paypalRequest('/v2/checkout/orders', {
        method: 'POST',
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: String(order._id),
                custom_id: String(order._id),
                amount: { currency_code: 'USD', value: order.totalPrice.toFixed(2) },
            }],
            application_context: { user_action: 'PAY_NOW' },
        }),
    });

    order.paypalOrderId = paypalOrder.id;
    await order.save();
    res.send({ id: paypalOrder.id });
}));

orderRouter.put('/:id/capture-paypal', auth, expressAsyncHandler(async (req, res) => {
    const order = await getOwnedOrder(req.params.id, req.user);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.isPaid) return res.send({ message: 'Order already paid', order });
    if (!order.paypalOrderId) return res.status(400).send({ message: 'No PayPal payment has been started' });

    const capture = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(order.paypalOrderId)}/capture`, {
        method: 'POST',
        body: '{}',
    });
    const result = await applyPayPalCapture(order, capture);
    if (!result.verified) {
        return res.status(400).send({ message: 'PayPal returned an invalid or unsuccessful capture' });
    }
    if (result.pending) {
        return res.status(202).send({ message: 'Payment received and under PayPal review', order });
    }
    res.send({ message: 'Payment verified and order confirmed', order });
}));

orderRouter.put('/:id/sync-paypal', auth, expressAsyncHandler(async (req, res) => {
    const order = await getOwnedOrder(req.params.id, req.user);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.isPaid) return res.send({ message: 'Order already paid', order });
    if (!order.paypalOrderId) return res.status(400).send({ message: 'No PayPal payment has been started' });

    const paypalOrder = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(order.paypalOrderId)}`);
    const result = await applyPayPalCapture(order, paypalOrder);
    if (!result.verified) {
        return res.status(400).send({ message: 'PayPal has not completed this payment' });
    }
    res.status(result.pending ? 202 : 200).send({
        message: result.pending ? 'Payment is still under PayPal review' : 'Payment verified and order confirmed',
        order,
    });
}));

orderRouter.put('/:id/pay', auth, (req, res) => {
    res.status(410).send({ message: 'Client-reported payments are no longer accepted' });
});

export default orderRouter;
