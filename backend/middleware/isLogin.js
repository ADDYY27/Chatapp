import jwt from 'jsonwebtoken';
import User from '../Models/userModels.js';

const isLogin = async (req, res, next) => {
    try {
        let token = req.cookies?.jwt;

        if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).send({ success: false, message: "User Unauthorized" });
        }

        let decode;
        try {
            decode = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === "TokenExpiredError") {
                return res.status(401).send({ success: false, message: "User Unauthorized - Token expired" });
            }
            return res.status(401).send({ success: false, message: "User Unauthorized - Invalid Token" });
        }

        if (!decode || !decode.userId) {
            return res.status(401).send({ success: false, message: "User Unauthorized - Invalid Token" });
        }

        const user = await User.findById(decode.userId).select("-password");
        if (!user) {
            return res.status(401).send({ success: false, message: "User not found" });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error(`Error in isLogin middleware: ${error.message}`);
        res.status(500).send({ success: false, message: "Internal server error" });
    }
};

export default isLogin;
