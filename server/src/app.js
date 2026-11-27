import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import customersRoutes from "./modules/customers/customers.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import financeRoutes from "./modules/finance/finance.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import myRoutes from "./modules/my/my.routes.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [env.CUSTOMER_ORIGIN, env.ADMIN_ORIGIN],
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "VÉLORA API",
    },
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/my", myRoutes);
// TODO Phase 3 slices: customers, categories, orders, inventory, payments, finance

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist.",
    },
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
