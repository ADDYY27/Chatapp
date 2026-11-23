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
    getGroupInfo,
    addMember,
    removeMember
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
router.post("/:id/add-member", isLogin, addMember);
router.post("/:id/members", isLogin, addMember);
router.delete("/:id/members/:memberId", isLogin, removeMember);
router.post("/:id/remove-member", isLogin, removeMember);
router.delete("/:id/members", isLogin, removeMember);
router.post("/:id/members/:memberId/remove", isLogin, removeMember);

export default router;