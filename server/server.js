import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import productRouter from "./routes/productRouter.js";
import userRouter from "./routes/userRouter.js";
import orderRouter, { handleStripeWebhook } from "./routes/orderRouter.js";
import adminRouter from "./routes/adminRouter.js";
import Product from "./models/productModel.js";
import Review from "./models/reviewModel.js";
import { buildSitemap, injectSeoMetadata } from "./seo.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Add it to server/.env before starting the server.');
}

const app = express();
app.set('trust proxy', 1);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shoppingcart";
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientBuildDirectory = path.resolve(serverDirectory, "../client/build");
const defaultDescription = "Nora's Workshop — handmade gifts, wedding and event decorations, and photography studio décor.";
const getPublicOrigin = (req) => (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

const synchronizeReviewRatings = async () => {
  const summaries = await Review.aggregate([
    { $group: { _id: '$product', rating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateMany({}, { $set: { rating: 0, numReviews: 0 } }, { timestamps: false });
  if (summaries.length) {
    await Product.bulkWrite(summaries.map((summary) => ({
      updateOne: {
        filter: { _id: summary._id },
        update: { $set: { rating: Math.round(summary.rating * 10) / 10, numReviews: summary.count } },
      },
    })), { timestamps: false });
  }
};

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/keys/paypal", (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || clientId === "sb" || !clientSecret) {
    return res.status(503).send({
      message: "PayPal Sandbox is not configured. Add a sandbox client ID and secret to server/.env, then restart the server.",
    });
  }
  res.send(clientId);
});

app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => {
  res.status(200).send({ status: "ok" });
});

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const products = await Product.find().select('_id slug updatedAt').sort({ _id: 1 }).lean();
    res.type('application/xml').send(buildSitemap(getPublicOrigin(req), products));
  } catch (error) {
    next(error);
  }
});

app.get('/robots.txt', (req, res) => {
  const origin = getPublicOrigin(req);
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /order',
    'Disallow: /profile',
    'Disallow: /login',
    'Disallow: /register',
    `Sitemap: ${origin}/sitemap.xml`,
  ].join('\n'));
});

app.use("/api", (req, res) => {
  res.status(404).send({ message: "API endpoint not found" });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientBuildDirectory, { index: false }));
  const indexHtml = readFile(path.join(clientBuildDirectory, "index.html"), "utf8");
  app.get("*", async (req, res, next) => {
    try {
      const origin = getPublicOrigin(req);
      const productMatch = req.path.match(/^\/product\/([a-f\d]{24})(?:\/[^/]+)?$/i);
      const product = productMatch
        ? await Product.findById(productMatch[1]).select('name description image slug').lean()
        : null;
      const pageTitles = {
        '/': "Handmade Gifts & Décor | Nora's Workshop",
        '/about': "Our Story | Nora's Workshop",
        '/help/shipping': "Shipping & Delivery | Nora's Workshop",
        '/help/returns': "Returns | Nora's Workshop",
        '/help/faq': "Frequently Asked Questions | Nora's Workshop",
      };
      const isPublicPage = Object.hasOwn(pageTitles, req.path);
      const canonicalPath = product ? `/product/${product._id}/${product.slug}` : req.path;
      const metadata = product ? {
        title: `${product.name} | Nora's Workshop`,
        description: product.description.slice(0, 180),
        image: product.image,
        type: 'product',
        url: `${origin}${canonicalPath}`,
      } : {
        title: pageTitles[req.path] || "Nora's Workshop",
        description: defaultDescription,
        image: `${origin}/images/noras-workshop-logo.png`,
        type: 'website',
        url: `${origin}${canonicalPath}`,
        noIndex: !isPublicPage,
      };
      res.send(injectSeoMetadata(await indexHtml, metadata));
    } catch (error) {
      next(error);
    }
  });
}

app.use((err, req, res, next) => {
  if (err?.code === 11000) {
    return res.status(409).send({ message: 'A record with that unique value already exists' });
  }
  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).send({ message: err.message });
  }
  res.status(err.status || 500).send({ message: err.message || 'Internal server error' });
});

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      bufferCommands: false,
    });

    console.log("Database connected");
    await synchronizeReviewRatings();

    const port = process.env.PORT || 5000;
    const server = app.listen(port, () => {
      console.log(`server listen at http://localhost:${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Stop the other process or change PORT in the server/.env file.`);
        process.exit(1);
      }

      console.error(error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error(
      "Set MONGODB_URI in your server/.env file or start a local MongoDB instance at mongodb://127.0.0.1:27017"
    );
    process.exit(1);
  }
};

startServer();
