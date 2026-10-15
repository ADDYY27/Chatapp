import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import Conversation from '../Models/conversationModels.js';
import User from '../Models/userModels.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:8080',
            'https://chatapp-production-856d.up.railway.app',
            'https://chatapp-ivory-eta.vercel.app',
        ],
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// Map of userId -> Set of socket IDs for multi-tab support
const userSocketmap = {};
const nudgeRateLimitMap = new Map();

export const getReciverSocketId = (receiverId) => {
    if (!receiverId) return null;
    const sockets = userSocketmap[receiverId];
    if (!sockets || sockets.size === 0) return null;
    return Array.from(sockets);
};

// ================= HANDSHAKE AUTHENTICATION =================
io.use((socket, next) => {
    try {
        const rawCookies = socket.handshake.headers.cookie;
        const parsedCookies = rawCookies ? cookie.parse(rawCookies) : {};
        const token = parsedCookies.jwt || socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication error: Token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
            return next(new Error("Authentication error: Invalid token"));
        }

        // Attach verified identity to the socket instance
        socket.userId = decoded.userId.toString();
        next();
    } catch (err) {
        return next(new Error("Authentication error: Invalid or expired token"));
    }
});

io.on('connection', (socket) => {
    const userId = socket.userId;

    if (!userSocketmap[userId]) {
        userSocketmap[userId] = new Set();
    }
    userSocketmap[userId].add(socket.id);
    socket.join(`user:${userId}`);

    io.emit("getOnlineUsers", Object.keys(userSocketmap));

    // ================= GROUP ROOMS =================
    socket.on("joinGroup", async (groupId) => {
        try {
            if (!groupId) return;
            const group = await Conversation.findOne({
                _id: groupId,
                isGroup: true,
                participants: userId
            });

            if (!group) {
                console.warn(`Unauthorized joinGroup attempt by ${userId} for group ${groupId}`);
                return;
            }

            socket.join(`group:${groupId}`);
        } catch (err) {
            console.error("Error joining group room:", err);
        }
    });

    socket.on("leaveGroup", (groupId) => {
        if (groupId) {
            socket.leave(`group:${groupId}`);
        }
    });

    // ================= TYPING INDICATORS =================
    socket.on("typing", ({ receiverId, conversationId }) => {
        if (!userId || !receiverId) return;
        const receiverSocketIds = getReciverSocketId(receiverId);
        if (receiverSocketIds) {
            io.to(receiverSocketIds).emit("userTyping", {
                senderId: userId,
                conversationId
            });
        }
    });

    socket.on("stopTyping", ({ receiverId, conversationId }) => {
        if (!userId || !receiverId) return;
        const receiverSocketIds = getReciverSocketId(receiverId);
        if (receiverSocketIds) {
            io.to(receiverSocketIds).emit("userStoppedTyping", {
                senderId: userId,
                conversationId
            });
        }
    });

    // ================= NUDGE =================
    socket.on("nudge", ({ receiverId }) => {
        if (!userId || !receiverId) return;
        const nudgeKey = `${userId}:${receiverId}`;
        const lastNudge = nudgeRateLimitMap.get(nudgeKey) || 0;
        const now = Date.now();
        if (now - lastNudge < 5000) {
            socket.emit("nudgeError", { message: "Please wait a few seconds before nudging again." });
            return;
        }
        nudgeRateLimitMap.set(nudgeKey, now);

        const receiverSocketIds = getReciverSocketId(receiverId);
        if (receiverSocketIds) {
            io.to(receiverSocketIds).emit("nudge", {
                senderId: userId
            });
        }
    });

    // ================= DISCONNECT =================
    socket.on('disconnect', async () => {
        if (userSocketmap[userId]) {
            userSocketmap[userId].delete(socket.id);
            if (userSocketmap[userId].size === 0) {
                delete userSocketmap[userId];
                io.emit("getOnlineUsers", Object.keys(userSocketmap));

                // Persist lastSeen in database when user's final active socket disconnects
                try {
                    const now = new Date();
                    await User.findByIdAndUpdate(userId, { lastSeen: now });
                } catch (err) {
                    console.error("Failed to update lastSeen on disconnect:", err);
                }
            }
        }
    });
});

export { app, io, server };