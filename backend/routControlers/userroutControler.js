import User from "../Models/userModels.js"
import bcryptjs from 'bcryptjs'
import jwtToken from "../utils/jwtToken.js";

const MAX_PIC_SIZE = 5 * 1024 * 1024; // 5MB base64
const ALLOWED_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"];

export const userRegister = async (req, res) => {
    try {
        const { fullname, username, email, gender, password, profilepic } = req.body;

        if (!username || !username.trim()) {
            return res.status(400).json({ error: "Username is required" });
        }

        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ error: "Username already taken" });
            }
            return res.status(400).json({ error: "Email already registered" });
        }

        // Validate profilepic
        let finalPic = "";
        if (profilepic) {
            // base64 data url validation
            const matches = profilepic.match(/^data:([^;]+);base64,/);
            if (!matches || !ALLOWED_TYPES.includes(matches[1])) {
                return res.status(400).json({ error: "Invalid image type" });
            }
            if (profilepic.length > MAX_PIC_SIZE * 1.4) {
                return res.status(400).json({ error: "Image too large (max 5MB)" });
            }
            finalPic = profilepic;
        } else {
            finalPic = gender === "male"
                ? `https://avatar.iran.liara.run/public/boy?username=${username}`
                : `https://avatar.iran.liara.run/public/girl?username=${username}`;
        }

        const hashPassword = bcryptjs.hashSync(password, 10);

        const newUser = new User({
            fullname,
            username,
            email,
            password: hashPassword,
            gender,
            profilepic: finalPic
        });

        await newUser.save();
        jwtToken(newUser._id, res);

        res.status(201).send({
            _id: newUser._id,
            fullname: newUser.fullname,
            username: newUser.username,
            profilepic: newUser.profilepic,
            email: newUser.email,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: error.message });
    }
}

export const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) return res.status(400).send({ success: false, message: "Email doesn't exist. Please register." })
        const comparePasss = bcryptjs.compareSync(password, user.password || "");
        if (!comparePasss) return res.status(400).send({ success: false, message: "Email or password doesn't match" })

        jwtToken(user._id, res);

        res.status(200).send({
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            profilepic: user.profilepic,
            email: user.email,
            message: "Successfully LogIn"
        })

    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
        console.log(error);
    }
}

export const userLogOut = async (req, res) => {
    try {
        res.cookie("jwt", '', { maxAge: 0 })
        res.status(200).send({ success: true, message: "User LogOut" })
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
        console.log(error);
    }
}

export const updateProfilePic = async (req, res) => {
    try {
        const { profilepic } = req.body;
        const userId = req.user._id;

        if (!profilepic) {
            return res.status(400).json({ error: "No image provided" });
        }

        const matches = profilepic.match(/^data:([^;]+);base64,/);
        if (!matches || !ALLOWED_TYPES.includes(matches[1])) {
            return res.status(400).json({ error: "Invalid image type" });
        }

        if (profilepic.length > MAX_PIC_SIZE * 1.4) {
            return res.status(400).json({ error: "Image too large (max 5MB)" });
        }

        const updated = await User.findByIdAndUpdate(
            userId,
            { profilepic },
            { new: true }
        ).select("-password");

        res.status(200).json({
            success: true,
            profilepic: updated.profilepic,
            user: {
                _id: updated._id,
                fullname: updated.fullname,
                username: updated.username,
                profilepic: updated.profilepic,
                email: updated.email,
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}