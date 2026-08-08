import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import { admin, auth, createRateLimiter, escapeRegex } from '../utils.js';

const productRouter = express.Router();
const reviewLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many review attempts. Please wait and try again.' });

const updateProductRating = async (productId) => {
    const [summary] = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: null, rating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(productId, {
        rating: summary ? Math.round(summary.rating * 10) / 10 : 0,
        numReviews: summary?.count || 0,
    }, { timestamps: false });
};

const normalizeProductImages = (image, images) => {
    const candidates = Array.isArray(images) ? images : [];
    return [...new Set([image, ...candidates]
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim()))].slice(0, 6);
};

const optionalProductText = (value) => typeof value === 'string' ? value.trim() : '';

const uploadToCloudinary = (imageBuffer) => new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: 'noras-workshop/products',
            resource_type: 'image',
            unique_filename: true,
            overwrite: false,
        },
        (error, result) => error ? reject(error) : resolve(result)
    );

    uploadStream.end(imageBuffer);
});

productRouter.get('/', expressAsyncHandler(async (req, res) => {
    const products = await Product.find();

    res.send(products);
}));

const PAGE_SIZE = 3;
productRouter.get('/search', expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const requestedPageSize = Number.parseInt(query.pageSize, 10);
    const requestedPage = Number.parseInt(query.page, 10);
    const pageSize = Number.isFinite(requestedPageSize)
        ? Math.min(Math.max(requestedPageSize, 1), 50)
        : PAGE_SIZE;
    const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = typeof query.query === 'string' ? query.query.trim().slice(0, 100) : '';
    const escapedSearchQuery = escapeRegex(searchQuery);
    const minimumRating = Number(rating);
    const [minimumPrice, maximumPrice] = price.split('-').map(Number);

    const queryFilter = searchQuery && searchQuery !== 'all' ?
        {
            name: {
                $regex: escapedSearchQuery,
                $options: 'i'
            }
        }
        : {};

    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter = rating && rating !== 'all' && Number.isFinite(minimumRating)
        ? { rating: { $gte: Math.min(Math.max(minimumRating, 0), 5) } }
        : {};
    const priceFilter = price && price !== 'all' && Number.isFinite(minimumPrice) && Number.isFinite(maximumPrice)
        ? { price: { $gte: Math.max(minimumPrice, 0), $lte: Math.max(maximumPrice, 0) } }
        : {};

    const sortOrder =
        order === 'featured' ? { featured: -1 }
            : order === 'lowest' ? { price: 1 }
                : order === 'highest' ? { price: -1 }
                    : order === 'toprated' ? { rating: -1 }
                        : order === 'newest' ? { createdAt: -1 }
                            : { _id: -1 };

    const products = await Product.find({
        ...queryFilter,
        ...categoryFilter,
        ...priceFilter,
        ...ratingFilter
    })
        .sort(sortOrder)
        .skip(pageSize * (page - 1))
        .limit(pageSize);

    const countProducts = await Product.countDocuments({
        ...queryFilter,
        ...categoryFilter,
        ...priceFilter,
        ...ratingFilter
    });

    res.send({
        products,
        countProducts,
        page,
        pages: Math.ceil(countProducts / pageSize)

    });
}));

productRouter.get('/categories', expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct('category');
    res.send(categories);
}))

productRouter.post(
    '/upload',
    auth,
    admin,
    express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], limit: '5mb' }),
    expressAsyncHandler(async (req, res) => {
        const acceptedContentTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!acceptedContentTypes.includes(req.headers['content-type']) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).send({ message: 'Choose a JPG, PNG, WebP, or GIF image' });
        }

        const cloudinaryConfiguration = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        };
        if (Object.values(cloudinaryConfiguration).some((value) => !value)) {
            return res.status(503).send({ message: 'Cloudinary image uploads are not configured' });
        }

        cloudinary.config({ ...cloudinaryConfiguration, secure: true });
        const uploadedImage = await uploadToCloudinary(req.body);
        res.status(201).send({ image: uploadedImage.secure_url });
    })
);

productRouter.patch('/:id/images', auth, admin, expressAsyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send({ message: 'Invalid product ID' });
    }
    if (!Array.isArray(req.body.images) || req.body.images.length === 0 || req.body.images.length > 6) {
        return res.status(400).send({ message: 'Provide between 1 and 6 product images' });
    }

    const images = normalizeProductImages(req.body.images[0], req.body.images);
    if (images.length !== req.body.images.length) {
        return res.status(400).send({ message: 'Product images must be unique, non-empty URLs' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send({ message: 'We could not find that product. It may have been removed.' });

    product.image = images[0];
    product.images = images;
    await product.save();
    res.send({ image: product.image, images: product.images });
}));

productRouter.post('/:id/reviews', auth, reviewLimiter, expressAsyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).send({ message: 'Invalid product ID' });
    const product = await Product.exists({ _id: req.params.id });
    if (!product) return res.status(404).send({ message: 'We could not find that product. It may have been removed.' });

    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).send({ message: 'Choose a rating from 1 to 5 stars' });
    if (comment.length < 10 || comment.length > 1000) return res.status(400).send({ message: 'Review text must be between 10 and 1000 characters' });

    const reviewer = await User.findById(req.user._id).select('username');
    if (!reviewer) return res.status(401).send({ message: 'Your account is no longer available' });
    const verifiedPurchase = Boolean(await Order.exists({ user: reviewer._id, isPaid: true, 'orderItems.product': req.params.id }));
    try {
        const review = await Review.create({ product: req.params.id, user: reviewer._id, username: reviewer.username, rating, comment, verifiedPurchase });
        await updateProductRating(req.params.id);
        res.status(201).send({ _id: review._id, username: review.username, rating: review.rating, comment: review.comment, verifiedPurchase: review.verifiedPurchase, createdAt: review.createdAt });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).send({ message: 'You have already reviewed this product' });
        throw error;
    }
}));

productRouter.delete('/:id/reviews/:reviewId', auth, admin, expressAsyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.reviewId)) return res.status(400).send({ message: 'Invalid review ID' });
    const review = await Review.findOneAndDelete({ _id: req.params.reviewId, product: req.params.id });
    if (!review) return res.status(404).send({ message: 'Review not found' });
    await updateProductRating(req.params.id);
    res.send({ message: 'Review removed' });
}));

productRouter.get('/:id', expressAsyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send({ message: 'Invalid product ID' });
    }
    const [product, reviews] = await Promise.all([
        Product.findById(req.params.id),
        Review.find({ product: req.params.id }).sort({ createdAt: -1 }).lean(),
    ]);
    if (product) {
        res.send({ ...product.toObject(), reviews });
    } else {
        res.status(404).send({ message: 'We could not find that product. It may have been removed.' });
    }
}));

productRouter.post('/create', auth, admin, expressAsyncHandler(async (req, res) => {
    const duplicate = await Product.findOne({
        $or: [{ name: req.body.name }, { slug: req.body.slug }],
    }).collation({ locale: 'en', strength: 2 });
    if (duplicate) {
        return res.status(409).send({
            message: duplicate.name === req.body.name
                ? 'A product with this name already exists'
                : 'A product with this slug already exists',
        });
    }

    const images = normalizeProductImages(req.body.image, req.body.images);
    const newProduct = new Product({
        name: req.body.name,
        slug: req.body.slug,
        image: images[0],
        images,
        brand: req.body.brand,
        category: req.body.category,
        description: req.body.description,
        materials: optionalProductText(req.body.materials),
        dimensions: optionalProductText(req.body.dimensions),
        preparationTime: optionalProductText(req.body.preparationTime),
        price: req.body.price,
        countMany: req.body.countMany,
        rating: 0,
        numReviews: 0

    });

    const product = await newProduct.save();
    res.status(201).send({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        images: product.images,
        brand: product.brand,
        category: product.category,
        description: product.description,
        materials: product.materials,
        dimensions: product.dimensions,
        preparationTime: product.preparationTime,
        price: product.price,
        countMany: product.countMany,
        rating: product.rating,
        numReviews: product.numReviews
    });
}));

productRouter.delete('/:id', auth, admin, expressAsyncHandler(async (req, res) => {
    const id = req.params.id
    const product = await Product.findByIdAndDelete(id)

    if (!product) return res.status(404).send({ message: 'We could not find that product. It may have been removed.' });

    await Review.deleteMany({ product: product._id });

    res.send({ message: 'Item Deleted' })
}));

productRouter.put('/:id/editItem/:slug', auth, admin, expressAsyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).send({ message: 'We could not find that product. It may have been removed.' });

    const requiredTextFields = ['name', 'slug', 'image', 'brand', 'category', 'description'];
    const missingField = requiredTextFields.find((field) => typeof req.body[field] !== 'string' || !req.body[field].trim());
    if (missingField) return res.status(400).send({ message: `${missingField} is required` });

    const nextName = req.body.name.trim();
    const nextSlug = req.body.slug.trim().toLowerCase();
    const duplicate = await Product.findOne({
        _id: { $ne: item._id },
        $or: [{ name: nextName }, { slug: nextSlug }],
    }).collation({ locale: 'en', strength: 2 });
    if (duplicate) {
        return res.status(409).send({
            message: duplicate.name === nextName
                ? 'A product with this name already exists'
                : 'A product with this slug already exists',
        });
    }

    item.name = nextName;
    item.slug = nextSlug;
    const images = normalizeProductImages(req.body.image, req.body.images);
    item.image = images[0];
    item.images = images;
    item.brand = req.body.brand.trim();
    item.category = req.body.category.trim();
    item.description = req.body.description.trim();
    item.materials = optionalProductText(req.body.materials);
    item.dimensions = optionalProductText(req.body.dimensions);
    item.preparationTime = optionalProductText(req.body.preparationTime);
    item.price = req.body.price;
    item.countMany = req.body.countMany;

    const updatedItem = await item.save();

    res.send({
            _id: updatedItem._id,
            name: updatedItem.name,
            slug: updatedItem.slug,
            image: updatedItem.image,
            images: updatedItem.images,
            brand: updatedItem.brand,
            category: updatedItem.category,
            description: updatedItem.description,
            materials: updatedItem.materials,
            dimensions: updatedItem.dimensions,
            preparationTime: updatedItem.preparationTime,
            price: updatedItem.price,
            countMany: updatedItem.countMany,
            rating: updatedItem.rating,
            numReviews: updatedItem.numReviews,
    });
}));

export default productRouter;
