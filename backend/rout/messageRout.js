import express from "express";

import {
    getMessages,
    sendMessage,
    markMessagesAsRead,
    clearChat,
    toggleReaction,
    togglePinMessage,
    deleteForMe,
    setDisappearingDuration
} from "../routControlers/messageroutControler.js";

import isLogin from "../middleware/isLogin.js";

const router = express.Router();

router.post('/send/:id', isLogin, sendMessage);
router.get('/:id', isLogin, getMessages);
router.put('/read/:id', isLogin, markMessagesAsRead);
router.delete('/clear/:id', isLogin, clearChat);
router.post('/:id/reaction', isLogin, toggleReaction);
router.put('/:id/pin', isLogin, togglePinMessage);
router.post('/:id/delete-for-me', isLogin, deleteForMe);
router.put('/conversation/:id/disappearing', isLogin, setDisappearingDuration);

export default router;