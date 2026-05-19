import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import path from "path";

import productRoutes from "./routes/product.routes";
import itemRoutes from "./routes/item.routes";
import serverRoutes from "./routes/server.routes";

const app = express();
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));

// ================================
// ROUTES
// ================================
app.use("/items", itemRoutes);
app.use("/products", productRoutes);
app.use("/server", serverRoutes);

// ================================
// ABOUT
// ================================
app.get("/about", (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).send(
            "-: Welcome To GCP Terraform About Me Page :- " +
                new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                })
        );
    } catch (err) {
        next(err);
    }
});

// ================================
// HOME
// ================================
app.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).send(
            "-: Welcome To GCP Terraform Home Page :- " +
                new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                })
        );
    } catch (err) {
        next(err);
    }
});

// ================================
// 404 HANDLER
// ================================
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
    });
});

// ================================
// ERROR
// ================================
app.use(
    (
        err: any,
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
);

export default app;