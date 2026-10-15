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
            finalPic = "";
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
            statusNote: newUser.statusNote,
            vibeTags: newUser.vibeTags,
            showLastSeen: newUser.showLastSeen,
            readReceipts: newUser.readReceipts,
            lastSeen: newUser.lastSeen,
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
            statusNote: user.statusNote || "",
            vibeTags: user.vibeTags || [],
            showLastSeen: user.showLastSeen !== false,
            readReceipts: user.readReceipts !== false,
            lastSeen: user.lastSeen || null,
            message: "Successfully LogIn"
        })

    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
        console.log(error);
    }
}

export const userLogOut = async (req, res) => {
    try {
        res.cookie("jwt", '', {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 0
        });
        res.status(200).send({ success: true, message: "User LogOut" });
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
                statusNote: updated.statusNote || "",
                vibeTags: updated.vibeTags || [],
                showLastSeen: updated.showLastSeen !== false,
                readReceipts: updated.readReceipts !== false,
                lastSeen: updated.lastSeen || null,
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullname, statusNote, vibeTags } = req.body;

        const updateData = {};

        // Validate and allowlist 'fullname'
        if (fullname !== undefined) {
            if (typeof fullname !== 'string' || !fullname.trim()) {
                return res.status(400).json({ success: false, message: "Full name is required and cannot be empty" });
            }
            if (fullname.trim().length > 60) {
                return res.status(400).json({ success: false, message: "Full name cannot exceed 60 characters" });
            }
            updateData.fullname = fullname.trim();
        }

        // Validate and allowlist 'statusNote'
        if (statusNote !== undefined) {
            if (typeof statusNote !== 'string') {
                return res.status(400).json({ success: false, message: "Status note must be a string" });
            }
            const trimmedNote = statusNote.trim();
            if (trimmedNote.length > 40) {
                return res.status(400).json({ success: false, message: "Status note cannot exceed 40 characters" });
            }
            updateData.statusNote = trimmedNote;
        }

        // Validate and allowlist 'vibeTags'
        if (vibeTags !== undefined) {
            if (!Array.isArray(vibeTags)) {
                return res.status(400).json({ success: false, message: "vibeTags must be an array" });
            }
            const normalizedTags = [];
            for (const tag of vibeTags) {
                if (typeof tag !== 'string') continue;
                let clean = tag.trim();
                if (!clean) continue;
                if (!clean.startsWith('#')) clean = `#${clean}`;
                if (clean.length > 25) {
                    return res.status(400).json({ success: false, message: "Each vibe tag cannot exceed 25 characters" });
                }
                if (!normalizedTags.includes(clean)) {
                    normalizedTags.push(clean);
                }
            }
            if (normalizedTags.length > 5) {
                return res.status(400).json({ success: false, message: "You can select a maximum of 5 vibe tags" });
            }
            updateData.vibeTags = normalizedTags;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields provided for update" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: updatedUser._id,
                fullname: updatedUser.fullname,
                username: updatedUser.username,
                email: updatedUser.email,
                profilepic: updatedUser.profilepic,
                statusNote: updatedUser.statusNote || "",
                vibeTags: updatedUser.vibeTags || [],
                showLastSeen: updatedUser.showLastSeen !== false,
                readReceipts: updatedUser.readReceipts !== false,
                lastSeen: updatedUser.lastSeen || null,
            }
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePrivacySettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { showLastSeen, readReceipts } = req.body;
        const updateData = {};

        if (showLastSeen !== undefined) {
            if (typeof showLastSeen !== 'boolean') {
                return res.status(400).json({ success: false, message: "showLastSeen must be a boolean" });
            }
            updateData.showLastSeen = showLastSeen;
        }

        if (readReceipts !== undefined) {
            if (typeof readReceipts !== 'boolean') {
                return res.status(400).json({ success: false, message: "readReceipts must be a boolean" });
            }
            updateData.readReceipts = readReceipts;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No valid privacy fields provided" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Privacy settings updated successfully",
            user: {
                _id: updatedUser._id,
                fullname: updatedUser.fullname,
                username: updatedUser.username,
                email: updatedUser.email,
                profilepic: updatedUser.profilepic,
                statusNote: updatedUser.statusNote || "",
                vibeTags: updatedUser.vibeTags || [],
                showLastSeen: updatedUser.showLastSeen !== false,
                readReceipts: updatedUser.readReceipts !== false,
                lastSeen: updatedUser.showLastSeen !== false ? (updatedUser.lastSeen || null) : null,
            }
        });
    } catch (error) {
        console.error("updatePrivacySettings error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};