

import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './DB/dbConnect.js';
import authRouter from './rout/authUser.js';
import messageRouter from './rout/messageRout.js';
import userRouter from './rout/userRout.js';
import { app, server } from './socket/socket.js';
import groupRouter from './rout/groupRout.js';
import mongoose from "mongoose";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:8080',
        'https://chatapp-production-856d.up.railway.app',
        'https://chatapp-ivory-eta.vercel.app',
    ],
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/message', messageRouter);
app.use('/api/user', userRouter);
app.use('/api/group', groupRouter);

// app.use(express.static(path.join(__dirname, '../frontend/dist')));

// app.get('/{*path}', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

app.get("/health", (req, res) => {
    if (mongoose.connection.readyState === 1) {
        return res.status(200).json({
            status: "ok",
            database: "connected"
        });
    }

    return res.status(503).json({
        status: "not ready",
        database: "disconnected"
    });
});

const PORT = process.env.PORT || 3000;

connectDB();
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});