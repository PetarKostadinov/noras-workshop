import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { admin, auth } from '../utils.js';

const adminRouter = express.Router();
const getPagination = (query) => {
    const requestedPage = Number.parseInt(query.page, 10);
    const requestedLimit = Number.parseInt(query.limit, 10);
    return {
        page: Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1,
        limit: Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 10,
    };
};

const paginatedResponse = (items, count, page, limit) => ({
    items,
    count,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
});

adminRouter.get('/dashboard', auth, admin, expressAsyncHandler(async (req, res) => {
    const [
        productCount,
        userCount,
        orderCount,
        pendingPaymentCount,
        activeFulfillmentCount,
        revenueRows,
        lowStockProducts,
        recentOrders,
    ] = await Promise.all([
        Product.countDocuments(),
        User.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ paymentStatus: { $in: ['pending', 'processing'] } }),
        Order.countDocuments({
            paymentStatus: 'paid',
            fulfillmentStatus: { $in: ['processing', 'shipped'] },
        }),
        Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        Product.find({ countMany: { $lte: 5 } })
            .select('name slug image countMany price')
            .sort({ countMany: 1, name: 1 })
            .limit(6)
            .lean(),
        Order.find()
            .select('user totalPrice paymentStatus fulfillmentStatus createdAt orderItems')
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
    ]);

    res.send({
        summary: {
            productCount,
            userCount,
            orderCount,
            paidRevenue: Math.round(((revenueRows[0]?.total || 0) + Number.EPSILON) * 100) / 100,
            pendingPaymentCount,
            activeFulfillmentCount,
        },
        lowStockProducts,
        recentOrders,
    });
}));

adminRouter.get('/products', auth, admin, expressAsyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req.query);
    const [items, count] = await Promise.all([
        Product.find()
            .select('name slug image category price countMany createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Product.countDocuments(),
    ]);
    res.send(paginatedResponse(items, count, page, limit));
}));

adminRouter.get('/orders', auth, admin, expressAsyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req.query);
    const [items, count] = await Promise.all([
        Order.find()
            .select('user totalPrice paymentMethod paymentStatus fulfillmentStatus createdAt orderItems')
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Order.countDocuments(),
    ]);
    res.send(paginatedResponse(items, count, page, limit));
}));

adminRouter.get('/users', auth, admin, expressAsyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req.query);
    const [items, count] = await Promise.all([
        User.find()
            .select('username email isAdmin createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        User.countDocuments(),
    ]);
    res.send(paginatedResponse(items, count, page, limit));
}));

export default adminRouter;
