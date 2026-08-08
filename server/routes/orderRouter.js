import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { auth, createRateLimiter, optionalAuth } from '../utils.js';
import Stripe from 'stripe';
import { expireOrderReservation, getReservationExpiry } from '../orderExpiration.js';

const orderRouter = express.Router();
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const checkoutLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many checkout attempts. Please wait and try again.',
});
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        const error = new Error('Card payments are not configured');
        error.status = 503;
        throw error;
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
const hashGuestToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const ensureActiveReservation = async (order) => {
    if (order.isPaid) return order;
    if (order.fulfillmentStatus === 'cancelled' || order.paymentStatus === 'expired') {
        const error = new Error('This unpaid order has expired and its items are available to other customers');
        error.status = 410;
        throw error;
    }
    if (order.expiresAt && order.expiresAt <= new Date()) {
        await expireOrderReservation(order._id);
        const currentOrder = await Order.findById(order._id);
        if (currentOrder?.isPaid) return currentOrder;
        const error = new Error('This unpaid order has expired and its items are available to other customers');
        error.status = 410;
        throw error;
    }
    return order;
};

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
    const isCurrentAdmin = await User.exists({ _id: user._id, isAdmin: true });
    const filter = isCurrentAdmin ? { _id: orderId } : { _id: orderId, user: user._id };
    return Order.findOne(filter);
};

const getAccessibleOrder = async (req) => {
    if (!mongoose.isValidObjectId(req.params.id)) return null;
    if (req.user) return getOwnedOrder(req.params.id, req.user);
    const guestToken = req.headers['x-guest-order-token'];
    if (typeof guestToken !== 'string' || guestToken.length < 32) return null;
    return Order.findOne({ _id: req.params.id, user: null, guestAccessTokenHash: hashGuestToken(guestToken) });
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
        const paidOrder = await Order.findOneAndUpdate(
            { _id: order._id, isPaid: false, fulfillmentStatus: { $ne: 'cancelled' } },
            { $set: {
                isPaid: true,
                paidAt: new Date(capturedPayment.create_time || Date.now()),
                paymentStatus: 'paid',
                fulfillmentStatus: 'processing',
                paymentResult: order.paymentResult,
            } },
            { new: true }
        );
        if (!paidOrder) return { verified: false, pending: false };
        order.set(paidOrder.toObject());
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

const applyStripeSession = async (order, session) => {
    const expectedAmount = Math.round(order.totalPrice * 100);
    const isValid = session.id === order.stripeCheckoutSessionId
        && session.metadata?.orderId === String(order._id)
        && session.currency === 'usd'
        && session.amount_total === expectedAmount;

    if (!isValid) return false;

    if (session.payment_status === 'paid') {
        const paymentResult = {
            id: session.payment_intent || session.id,
            status: session.payment_status,
            update_time: new Date().toISOString(),
            email_address: session.customer_details?.email,
        };
        const paidOrder = await Order.findOneAndUpdate(
            { _id: order._id, isPaid: false, fulfillmentStatus: { $ne: 'cancelled' } },
            { $set: {
                isPaid: true,
                paidAt: new Date(),
                paymentStatus: 'paid',
                fulfillmentStatus: 'processing',
                paymentResult,
            } },
            { new: true }
        );
        if (!paidOrder) return false;
        order.set(paidOrder.toObject());
        return true;
    }

    return false;
};

orderRouter.post('/', optionalAuth, checkoutLimiter, expressAsyncHandler(async (req, res) => {
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

        const paymentMethod = ['PayPal', 'Card'].includes(req.body.paymentMethod)
            ? req.body.paymentMethod
            : 'PayPal';
        const contactEmail = String(req.user?.email || req.body.contactEmail || '').trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(contactEmail)) {
            const emailError = new Error('Enter a valid email address');
            emailError.status = 400;
            throw emailError;
        }
        const guestAccessToken = req.user ? null : crypto.randomBytes(32).toString('hex');
        const newOrder = new Order({
            orderItems,
            shippingInfo: req.body.shippingInfo,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            user: req.user?._id || null,
            contactEmail,
            guestAccessTokenHash: guestAccessToken ? hashGuestToken(guestAccessToken) : undefined,
            paymentStatus: 'pending',
            fulfillmentStatus: 'awaiting_payment',
            expiresAt: getReservationExpiry(),
        });
        const order = await newOrder.save();
        const orderResponse = order.toObject();
        delete orderResponse.guestAccessTokenHash;
        res.status(201).send({ message: 'Order created and awaiting payment', order: orderResponse, ...(guestAccessToken ? { guestAccessToken } : {}) });
    } catch (error) {
        await restoreInventory(reservedItems);
        if ([400, 409].includes(error.status)) {
            return res.status(error.status).send({ message: error.message });
        }
        throw error;
    }
}));

orderRouter.get('/mine', auth, expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.send(orders);
}));

orderRouter.get('/:id', optionalAuth, expressAsyncHandler(async (req, res) => {
    let order = await getAccessibleOrder(req);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (!order.isPaid && order.fulfillmentStatus !== 'cancelled') {
        try {
            order = await ensureActiveReservation(order);
        } catch (error) {
            if (error.status !== 410) throw error;
            order = await getAccessibleOrder(req);
        }
    }
    res.send(order);
}));

orderRouter.post('/:id/stripe-checkout', optionalAuth, expressAsyncHandler(async (req, res) => {
    let order = await getAccessibleOrder(req);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    order = await ensureActiveReservation(order);
    if (order.isPaid) return res.status(400).send({ message: 'This order is already paid' });
    if (order.paymentMethod !== 'Card') {
        return res.status(400).send({ message: 'Card payment is not selected for this order' });
    }

    const stripe = getStripe();
    if (order.stripeCheckoutSessionId) {
        const existingSession = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
        if (existingSession.status === 'open' && existingSession.url) {
            return res.send({ url: existingSession.url });
        }
        if (existingSession.payment_status === 'paid') {
            await applyStripeSession(order, existingSession);
            return res.status(400).send({ message: 'This order is already paid' });
        }
    }

    order.expiresAt = getReservationExpiry();
    await order.save();

    const previousAttempt = order.stripeCheckoutAttempt || 0;
    const attemptFilter = previousAttempt === 0
        ? { $or: [{ stripeCheckoutAttempt: 0 }, { stripeCheckoutAttempt: { $exists: false } }] }
        : { stripeCheckoutAttempt: previousAttempt };
    const lockedOrder = await Order.findOneAndUpdate(
        { _id: order._id, isPaid: false, ...attemptFilter },
        { $inc: { stripeCheckoutAttempt: 1 } },
        { new: true }
    );
    if (!lockedOrder) {
        return res.status(409).send({ message: 'Card checkout is already being prepared. Please try again.' });
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: order.contactEmail,
        client_reference_id: String(lockedOrder._id),
        metadata: { orderId: String(lockedOrder._id), ...(lockedOrder.user ? { userId: String(lockedOrder.user) } : {}) },
        line_items: [{
            quantity: 1,
            price_data: {
                currency: 'usd',
                unit_amount: Math.round(lockedOrder.totalPrice * 100),
                product_data: { name: `Nora's Workshop order ${lockedOrder._id}` },
            },
        }],
        success_url: `${getClientUrl()}/order/${lockedOrder._id}?stripe=success`,
        cancel_url: `${getClientUrl()}/order/${lockedOrder._id}?stripe=cancelled`,
        expires_at: Math.floor(lockedOrder.expiresAt.getTime() / 1000),
    }, {
        idempotencyKey: `order-${lockedOrder._id}-attempt-${lockedOrder.stripeCheckoutAttempt}`,
    });

    lockedOrder.stripeCheckoutSessionId = session.id;
    await lockedOrder.save();
    res.status(201).send({ url: session.url });
}));

orderRouter.put('/:id/sync-stripe', optionalAuth, expressAsyncHandler(async (req, res) => {
    let order = await getAccessibleOrder(req);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    order = await ensureActiveReservation(order);
    if (order.isPaid) return res.send({ message: 'Order already paid', order });
    if (order.paymentMethod !== 'Card' || !order.stripeCheckoutSessionId) {
        return res.status(400).send({ message: 'No card payment has been started' });
    }

    const session = await getStripe().checkout.sessions.retrieve(order.stripeCheckoutSessionId);
    const paid = await applyStripeSession(order, session);
    if (!paid) return res.status(202).send({ message: 'Card payment is not complete yet', order });
    res.send({ message: 'Card payment verified and order confirmed', order });
}));

orderRouter.post('/:id/paypal-order', optionalAuth, expressAsyncHandler(async (req, res) => {
    let order = await getAccessibleOrder(req);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    order = await ensureActiveReservation(order);
    if (order.isPaid) return res.status(400).send({ message: 'This order is already paid' });
    if (order.paymentMethod !== 'PayPal') return res.status(400).send({ message: 'PayPal is not selected for this order' });

    order.expiresAt = getReservationExpiry();
    await order.save();

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

orderRouter.put('/:id/capture-paypal', optionalAuth, expressAsyncHandler(async (req, res) => {
    let order = await getAccessibleOrder(req);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    order = await ensureActiveReservation(order);
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

orderRouter.put('/:id/sync-paypal', optionalAuth, expressAsyncHandler(async (req, res) => {
    let order = await getAccessibleOrder(req);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    order = await ensureActiveReservation(order);
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

orderRouter.put('/:id/pay', optionalAuth, (req, res) => {
    res.status(410).send({ message: 'Client-reported payments are no longer accepted' });
});

export default orderRouter;

export const handleStripeWebhook = async (req, res) => {
    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            return res.status(503).send('Stripe webhook is not configured');
        }
        const stripe = getStripe();
        const event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );

        if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
            const session = event.data.object;
            const order = mongoose.isValidObjectId(session.metadata?.orderId)
                ? await Order.findById(session.metadata.orderId)
                : null;
            if (order && order.paymentMethod === 'Card' && !order.isPaid) {
                await applyStripeSession(order, session);
            }
        }

        res.send({ received: true });
    } catch (error) {
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
};
