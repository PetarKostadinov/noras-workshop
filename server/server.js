import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import seedRouter from "./routes/seedRouter.js";
import productRouter from "./routes/productRouter.js";
import userRouter from "./routes/userRuoter.js";
import orderRouter, { handleStripeWebhook } from "./routes/orderRouter.js";

dotenv.config();

const app = express();
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shoppingcart";
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(serverDirectory, 'uploads'), {
  fallthrough: false,
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

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

app.use("/api/seed", seedRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);

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
