import express from "express"

import {
    getMessages,
    sendMessage,
    markMessagesAsRead
} from "../routControlers/messageroutControler.js";

import isLogin from "../middleware/isLogin.js";

const router = express.Router();

router.post('/send/:id', isLogin, sendMessage);

router.get('/:id', isLogin, getMessages);

router.put('/read/:id', isLogin, markMessagesAsRead);

export default router;