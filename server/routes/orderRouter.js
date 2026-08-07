import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { auth } from '../utils.js';
import Stripe from 'stripe';

const orderRouter = express.Router();
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        const error = new Error('Card payments are not configured');
        error.status = 503;
        throw error;
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

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

const applyStripeSession = async (order, session) => {
    const expectedAmount = Math.round(order.totalPrice * 100);
    const isValid = session.id === order.stripeCheckoutSessionId
        && session.metadata?.orderId === String(order._id)
        && session.currency === 'usd'
        && session.amount_total === expectedAmount;

    if (!isValid) return false;

    if (session.payment_status === 'paid') {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentStatus = 'paid';
        order.fulfillmentStatus = 'processing';
        order.paymentResult = {
            id: session.payment_intent || session.id,
            status: session.payment_status,
            update_time: new Date().toISOString(),
            email_address: session.customer_details?.email,
        };
        await order.save();
        return true;
    }

    return false;
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

        const paymentMethod = ['PayPal', 'Card'].includes(req.body.paymentMethod)
            ? req.body.paymentMethod
            : 'PayPal';
        const newOrder = new Order({
            orderItems,
            shippingInfo: req.body.shippingInfo,
            paymentMethod,
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

orderRouter.post('/:id/stripe-checkout', auth, expressAsyncHandler(async (req, res) => {
    const order = await getOwnedOrder(req.params.id, req.user);
    if (!order) return res.status(404).send({ message: 'Order not found' });
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

    const previousAttempt = order.stripeCheckoutAttempt || 0;
    const attemptFilter = previousAttempt === 0
        ? { $or: [{ stripeCheckoutAttempt: 0 }, { stripeCheckoutAttempt: { $exists: false } }] }
        : { stripeCheckoutAttempt: previousAttempt };
    const lockedOrder = await Order.findOneAndUpdate(
        { _id: order._id, user: order.user, isPaid: false, ...attemptFilter },
        { $inc: { stripeCheckoutAttempt: 1 } },
        { new: true }
    );
    if (!lockedOrder) {
        return res.status(409).send({ message: 'Card checkout is already being prepared. Please try again.' });
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: req.user.email,
        client_reference_id: String(lockedOrder._id),
        metadata: { orderId: String(lockedOrder._id), userId: String(lockedOrder.user) },
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
    }, {
        idempotencyKey: `order-${lockedOrder._id}-attempt-${lockedOrder.stripeCheckoutAttempt}`,
    });

    lockedOrder.stripeCheckoutSessionId = session.id;
    await lockedOrder.save();
    res.status(201).send({ url: session.url });
}));

orderRouter.put('/:id/sync-stripe', auth, expressAsyncHandler(async (req, res) => {
    const order = await getOwnedOrder(req.params.id, req.user);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.isPaid) return res.send({ message: 'Order already paid', order });
    if (order.paymentMethod !== 'Card' || !order.stripeCheckoutSessionId) {
        return res.status(400).send({ message: 'No card payment has been started' });
    }

    const session = await getStripe().checkout.sessions.retrieve(order.stripeCheckoutSessionId);
    const paid = await applyStripeSession(order, session);
    if (!paid) return res.status(202).send({ message: 'Card payment is not complete yet', order });
    res.send({ message: 'Card payment verified and order confirmed', order });
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
