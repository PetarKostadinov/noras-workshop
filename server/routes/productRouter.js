import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import { admin, auth } from '../utils.js';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const productRouter = express.Router();
const routeDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(routeDirectory, '..', 'uploads');
const imageExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
};

productRouter.get('/', async (req, res) => {
    const products = await Product.find();

    res.send(products);
});

// productRouter.get('/', (req, res) => {
//     res.send('Hello World!');
//   });

productRouter.get('/products', expressAsyncHandler(async (req, res) => {
    const perPage = 5;
    const page = parseInt(req.query.page) || 1;
    const [products, count] = await Promise.all([
        Product.find().skip((page - 1) * perPage).limit(perPage),
        Product.countDocuments(),
    ]);
    res.json({ products, page, totalPages: Math.ceil(count / perPage) });
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
        const extension = imageExtensions[req.headers['content-type']];
        if (!extension || !Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).send({ message: 'Choose a JPG, PNG, WebP, or GIF image' });
        }

        await mkdir(uploadDirectory, { recursive: true });
        const filename = `${crypto.randomUUID()}${extension}`;
        await writeFile(path.join(uploadDirectory, filename), req.body, { flag: 'wx' });
        res.status(201).send({ image: `/uploads/${filename}` });
    })
);

productRouter.get('/_id/:id', async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id });
    if (product) {
        res.send(product);
    } else {
        res.status(404).send({ message: 'We could not find that product. It may have been removed.' });
    }
});

productRouter.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
        res.send(product);
    } else {
        res.status(404).send({ message: 'We could not find that product. It may have been removed.' });
    }
});

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

    const nextName = req.body.name || item.name;
    const nextSlug = req.body.slug || item.slug;
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

    if (item) {
        item._id = req.body._id || item._id
        item.name = req.body.name || item.name;
        item.slug = req.body.slug || item.slug;
        item.image = req.body.image || item.image;
        item.brand = req.body.brand || item.brand;
        item.category = req.body.category || item.category;
        item.description = req.body.description || item.description;
        item.price = req.body.price === '' || req.body.price === undefined ? item.price : req.body.price;
        item.countMany = req.body.countMany === '' || req.body.countMany === undefined ? item.countMany : req.body.countMany;
        item.rating = req.body.rating === '' || req.body.rating === undefined ? item.rating : req.body.rating;
        item.numReviews = req.body.numReviews === '' || req.body.numReviews === undefined ? item.numReviews : req.body.numReviews;

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
            // token:generateToken(updatedItem)
        });

    }
}));

export default productRouter;
