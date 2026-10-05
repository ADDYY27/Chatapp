import express from "express"
import { userRegister, userLogin, userLogOut, updateProfilePic } from "../routControlers/userroutControler.js";
import isLogin from "../middleware/isLogin.js";

const router = express.Router();

router.post('/register', userRegister);
router.post('/login', userLogin);
router.post('/logout', userLogOut);
router.put('/profile/pic', isLogin, updateProfilePic);

export default router