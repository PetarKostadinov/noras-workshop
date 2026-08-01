import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import seedRouter from "./routes/seedRouter.js";
import productRouter from "./routes/productRouter.js";
import userRouter from "./routes/userRuoter.js";
import orderRouter from "./routes/orderRouter.js";

dotenv.config();

const app = express();
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shoppingcart";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/keys/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "sb");
});

app.use("/api/seed", seedRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
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