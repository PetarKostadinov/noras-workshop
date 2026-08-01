import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import { auth } from '../utils.js';

const productRouter = express.Router();

productRouter.get('/', async (req, res) => {
    const products = await Product.find();

    res.send(products);
});

// productRouter.get('/', (req, res) => {
//     res.send('Hello World!');
//   });

productRouter.get('/products', (req, res) => {
    const perPage = 5;
    const page = parseInt(req.query.page) || 1;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedPosts = posts.slice(start, end);
    const totalPages = Math.ceil(posts.length / perPage);

    res.json({
        posts: paginatedPosts,
        page,
        totalPages,
    });
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

productRouter.get('/_id/:id', async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id });
    if (product) {
        res.send(product);
    } else {
        res.status(404).send({ message: 'Product Not Found' });
    }
});

productRouter.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
        res.send(product);
    } else {
        res.status(404).send({ message: 'Product Not Found' });
    }
});

productRouter.post('/create', expressAsyncHandler(async (req, res) => {

    const currProduct = await Product.find({});

    if (currProduct) {
        const nameExists = currProduct.find(x => x.name === req.body.name);

        if (nameExists) {
            res.send({ message: 'Product with the same Name already in the list!', status: 409  });
        }

        const slugExists = currProduct.find(x => x.slug === req.body.slug);

        if (slugExists) {
            res.send({ message: 'Product with the same Slug already in the list!', status: 409 });
        }
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
    res.send({
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

productRouter.delete('/:id', async (req, res) => {
    const id = req.params.id
    await Product.findByIdAndDelete(id)

    res.send({ message: 'Item Deleted' })
});

productRouter.put('/:id/editItem/:slug', auth, expressAsyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id);
    const currProduct = await Product.find({});
    if (currProduct) {
        const nameExists = currProduct.find(x => x.name === req.body.name);

        if (nameExists) {
            res.send({message:'Product with the same Name already in the list!', status: 409});
        }

        const slugExists = currProduct.find(x => x.slug === req.body.slug);

        if (slugExists) {
            res.send({message:'Product with the same Slug already in the list!', status: 409});
        }
    }

    if (item) {
        item._id = req.body._id || item._id
        item.name = req.body.name || item.name;
        item.slug = req.body.slug || item.slug;
        item.image = req.body.image || item.image;
        item.brand = req.body.brand || item.brand;
        item.category = req.body.category || item.category;
        item.description = req.body.description || item.description;
        item.price = req.body.price || item.price;
        item.countMany = req.body.countMany || item.countMany;
        item.rating = req.body.rating || item.rating;
        item.numReviews = req.body.numReviews || item.numReviews;

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

    } else {
        res.status(404).send({ message: 'Item Not Found' })
    }
}));

export default productRouter;
