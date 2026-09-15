import express from "express";
import isLogin from "../middleware/isLogin.js";

import {
    createGroup,
    getMyGroups,
    getGroupMessages,
    sendGroupMessage
} from "../routControlers/groupControler.js";

const router = express.Router();

router.post("/create", isLogin, createGroup);

router.get("/my-groups", isLogin, getMyGroups);

router.get("/:id/messages", isLogin, getGroupMessages);

router.post("/:id/messages", isLogin, sendGroupMessage);

export default router;