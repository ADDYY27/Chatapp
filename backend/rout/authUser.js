import express from "express"
import { userRegister, userLogin, userLogOut, updateProfilePic, updateProfile } from "../routControlers/userroutControler.js";
import isLogin from "../middleware/isLogin.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post('/register', authLimiter, userRegister);
router.post('/login', authLimiter, userLogin);
router.post('/logout', userLogOut);
router.put('/profile/pic', isLogin, updateProfilePic);
router.put('/profile', isLogin, updateProfile);

export default router