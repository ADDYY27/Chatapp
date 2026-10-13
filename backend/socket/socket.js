import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'https://chatapp-production-856d.up.railway.app',
            'https://chatapp-ivory-eta.vercel.app',
        ],
        methods: ["GET", "POST"],
        credentials: true,
    }
});

export const getReciverSocketId = (receverId) => {
    return userSocketmap[receverId];
};

const userSocketmap = {};
const nudgeRateLimitMap = new Map();

io.on('connection', (socket) => {

    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
        userSocketmap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketmap));


    // ================= GROUP ROOMS =================

   socket.on("joinGroup", (groupId) => {
    console.log("USER JOINED GROUP:", groupId);

    socket.join(`group:${groupId}`);
});
    socket.on("leaveGroup", (groupId) => {
        socket.leave(`group:${groupId}`);
    });

    // ================= TYPING INDICATORS =================
    socket.on("typing", ({ receiverId, conversationId }) => {
        if (!userId || !receiverId) return;
        const receiverSocketId = getReciverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", {
                senderId: userId,
                conversationId
            });
        }
    });

    socket.on("stopTyping", ({ receiverId, conversationId }) => {
        if (!userId || !receiverId) return;
        const receiverSocketId = getReciverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userStoppedTyping", {
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

        const receiverSocketId = getReciverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("nudge", {
                senderId: userId
            });
        }
    });

    // ================= DISCONNECT =================

    socket.on('disconnect', () => {
        if (userSocketmap[userId] === socket.id) {
            delete userSocketmap[userId];

            io.emit(
                "getOnlineUsers",
                Object.keys(userSocketmap)
            );
        }
    });

});

export { app, io, server };