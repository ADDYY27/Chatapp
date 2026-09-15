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
        ],
        methods: ["GET", "POST"],
        credentials: true,
    }
});

export const getReciverSocketId = (receverId) => {
    return userSocketmap[receverId];
};

const userSocketmap = {};

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