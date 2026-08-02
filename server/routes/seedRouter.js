import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import testProducts from "../data/testProducts.js";

const seedRouter = express.Router();

seedRouter.post('/products', expressAsyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send({ message: 'Not found' });
  }
  const replacedDemoSlugs = [
    'bacardi-oro',
    'hendricks-gin',
    'jack-daniels-single-barrel',
    'veuve-clicquot-yellow-label',
  ];
  const removed = await Product.deleteMany({ slug: { $in: replacedDemoSlugs } });

  const operations = testProducts.map((product) => ({
    updateOne: {
      filter: { slug: product.slug },
      update: { $set: product },
      upsert: true,
    },
  }));

  const result = await Product.bulkWrite(operations);
  const products = await Product.find({
    slug: { $in: testProducts.map((product) => product.slug) },
  }).sort({ name: 1 });

  res.send({
    message: "Test products seeded successfully",
    removed: removed.deletedCount,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
    products,
  });
}));


export default seedRouter;
