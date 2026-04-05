// import { Server } from 'socket.io';
// import http from 'http';
// import express from 'express';

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: ['http://localhost:5174'], // ✅ local dev — change to your deployed URL in production
//         methods: ["GET", "POST"],
//         credentials: true,
//     }
// });

// export const getReciverSocketId = (receverId) => {
//     return userSocketmap[receverId];
// };

// const userSocketmap = {}; // { userId: socketId }

// io.on('connection', (socket) => {
//     const userId = socket.handshake.query.userId;

//     if (userId && userId !== "undefined") {
//         userSocketmap[userId] = socket.id;
//     }

//     // emit online users list to everyone
//     io.emit("getOnlineUsers", Object.keys(userSocketmap));

//     socket.on('disconnect', () => {
//         delete userSocketmap[userId];
//         io.emit('getOnlineUsers', Object.keys(userSocketmap));
//     });
// });

// export { app, io, server };

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
            'https://slrtech-chatapp.onrender.com', // keep for production
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

    socket.on('disconnect', () => {
        delete userSocketmap[userId];
        io.emit('getOnlineUsers', Object.keys(userSocketmap));
    });
});

export { app, io, server };
