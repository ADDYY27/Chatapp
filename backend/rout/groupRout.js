import express from "express";
import isLogin from "../middleware/isLogin.js";

import {
    createGroup,
    getMyGroups,
    getGroupMessages,
    sendGroupMessage,
    updateGroupPic,
    updateGroupName,
    clearGroup,
    getGroupInfo
} from "../routControlers/groupControler.js";

const router = express.Router();

router.post("/create", isLogin, createGroup);
router.get("/my-groups", isLogin, getMyGroups);
router.get("/:id/messages", isLogin, getGroupMessages);
router.post("/:id/messages", isLogin, sendGroupMessage);
router.put("/:id/pic", isLogin, updateGroupPic);
router.put("/:id/name", isLogin, updateGroupName);
router.delete("/:id/clear", isLogin, clearGroup);
router.get("/:id/info", isLogin, getGroupInfo);

export default router;