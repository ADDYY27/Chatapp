

// import dotenv from 'dotenv';
// import cors from 'cors';
// import express from 'express';
// import cookieParser from 'cookie-parser';
// import connectDB from './DB/dbConnect.js';
// import authRouter from './rout/authUser.js';
// import messageRouter from './rout/messageRout.js';
// import userRouter from './rout/userRout.js';
// import { app, server } from './socket/socket.js'; // ✅ import from socket.js

// dotenv.config();

// app.use(cors({
//     origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
//     credentials: true
// }));

// app.use(express.json());
// app.use(cookieParser());

// app.use('/api/auth', authRouter);
// app.use('/api/message', messageRouter);
// app.use('/api/user', userRouter);



// app.use(express.static(path.join(__dirname, '../frontend/dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });








// app.get('/', (req, res) => {
//     res.send('Hello addy!');
// });

// const PORT = process.env.PORT || 3000;

// connectDB();
// server.listen(PORT, () => {  // ✅ server.listen not app.listen
//     console.log(`Server is running on port ${PORT}`);
// });

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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/message', messageRouter);
app.use('/api/user', userRouter);

// ✅ serve frontend in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;

connectDB();
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});