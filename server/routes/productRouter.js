import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/productModel.js';
import { admin, auth } from '../utils.js';

const productRouter = express.Router();

const uploadToCloudinary = (imageBuffer) => new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: 'noras-atelier/products',
            resource_type: 'image',
            unique_filename: true,
            overwrite: false,
        },
        (error, result) => error ? reject(error) : resolve(result)
    );

    uploadStream.end(imageBuffer);
});

productRouter.get('/', async (req, res) => {
    const products = await Product.find();

    res.send(products);
});

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
    const brand = query.brand || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter = searchQuery && searchQuery !== 'all' ?
        {
            name: {
                $regex: searchQuery,
                $options: 'i'
            }
        }
        : {};

    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter = rating && rating !== 'all' ? { rating: { $gte: Number(rating) } } : {};
    const priceFilter = price && price !== 'all' ?
        { price: { $gte: Number(price.split('-')[0]), $lte: Number(price.split('-')[1]) } } : {};

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

productRouter.get('/_id/:id', expressAsyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send({ message: 'Invalid product ID' });
    }
    const product = await Product.findOne({ _id: req.params.id });
    if (product) {
        res.send(product);
    } else {
        res.status(404).send({ message: 'We could not find that product. It may have been removed.' });
    }
}));

productRouter.get('/:id', expressAsyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send({ message: 'Invalid product ID' });
    }
    const product = await Product.findById(req.params.id);
    if (product) {
        res.send(product);
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

    const newProduct = new Product({
        name: req.body.name,
        slug: req.body.slug,
        image: req.body.image,
        brand: req.body.brand,
        category: req.body.category,
        description: req.body.description,
        price: req.body.price,
        countMany: req.body.countMany,
        rating: req.body.rating,
        numReviews: req.body.numReviews

    });

    const product = await newProduct.save();
    res.status(201).send({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        brand: product.brand,
        category: product.category,
        description: product.description,
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
    item.image = req.body.image.trim();
    item.brand = req.body.brand.trim();
    item.category = req.body.category.trim();
    item.description = req.body.description.trim();
    item.price = req.body.price;
    item.countMany = req.body.countMany;
    item.rating = req.body.rating;
    item.numReviews = req.body.numReviews;

    const updatedItem = await item.save();

    res.send({
            _id: updatedItem._id,
            name: updatedItem.name,
            slug: updatedItem.slug,
            image: updatedItem.image,
            brand: updatedItem.brand,
            category: updatedItem.category,
            description: updatedItem.description,
            price: updatedItem.price,
            countMany: updatedItem.countMany,
            rating: updatedItem.rating,
            numReviews: updatedItem.numReviews,
    });
}));

export default productRouter;
