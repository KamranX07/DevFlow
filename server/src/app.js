import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import prisma from "./config/db.js";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());

app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            success: true,
            message: "Devflow API is running",
            databse: "connected",
        });
    } catch (error) {
        console.error("Database Connection failed:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }    
});

export default app;