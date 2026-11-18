import mongoose from "mongoose";
import Conversation from "../Models/conversationModels.js";
import User from "../Models/userModels.js";
import Message from "../Models/messageSchema.js";
import { io } from "../socket/socket.js";

const MAX_PIC_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"];

export const createGroup = async (req, res) => {
    try {
        const { groupName, members } = req.body;
        const adminId = req.user._id;

        if (!groupName || !groupName.trim()) {
            return res.status(400).json({ success: false, message: "Group name is required" });
        }

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ success: false, message: "Select at least one member" });
        }

        const participantIds = [
            ...new Set([adminId.toString(), ...members.map((id) => id.toString())])
        ];

        const users = await User.find({ _id: { $in: participantIds } }).select("_id");

        if (users.length !== participantIds.length) {
            return res.status(400).json({ success: false, message: "One or more selected users do not exist" });
        }

        const group = await Conversation.create({
            participants: participantIds,
            isGroup: true,
            groupName: groupName.trim(),
            groupAdmin: adminId
        });

        const populatedGroup = await Conversation.findById(group._id)
            .populate("participants", "fullname username profilepic")
            .populate("groupAdmin", "fullname username profilepic");

        res.status(201).json({ success: true, message: "Group created successfully", group: populatedGroup });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Conversation.find({
            participants: userId,
            isGroup: true,
            clearedBy: { $not: { $elemMatch: { userId: userId } } }
        })
            .populate("participants", "fullname username profilepic")
            .populate("groupAdmin", "fullname username profilepic")
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, groups });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getGroupMessages = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        const group = await Conversation.findOne({
            _id: groupId,
            isGroup: true,
            participants: userId
        });

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found or access denied" });
        }

        // Get clearedAt timestamp for this user
        const clearEntry = group.clearedBy?.find(
            (c) => c.userId?.toString() === userId.toString()
        );
        const clearedAt = clearEntry?.clearedAt || null;

        const query = {
            conversationId: groupId,
            isGroupMessage: true
        };

        if (clearedAt) {
            query.createdAt = { $gt: clearedAt };
        }

        const messages = await Message.find(query)
            .populate("senderId", "fullname username profilepic")
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, messages });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const sendGroupMessage = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { message } = req.body;
        const senderId = req.user._id;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message cannot be empty" });
        }

        const group = await Conversation.findOne({
            _id: groupId,
            isGroup: true,
            participants: senderId
        });

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found or access denied" });
        }

        const newMessage = await Message.create({
            senderId: senderId,
            reciverId: null,
            message: message.trim(),
            conversationId: groupId,
            isGroupMessage: true
        });

        await Conversation.findByIdAndUpdate(groupId, { $push: { messages: newMessage._id } });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullname username profilepic");

        io.to(`group:${groupId}`).emit("groupMessage", populatedMessage);

        res.status(201).json({ success: true, message: populatedMessage });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Admin
export const updateGroupPic = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { groupPic } = req.body;
        const userId = req.user._id;

        const group = await Conversation.findOne({ _id: groupId, isGroup: true });

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        if (group.groupAdmin?.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the group admin can change the group picture" });
        }

        if (!groupPic) {
            return res.status(400).json({ success: false, message: "No image provided" });
        }

        const matches = groupPic.match(/^data:([^;]+);base64,/);
        if (!matches || !ALLOWED_TYPES.includes(matches[1])) {
            return res.status(400).json({ success: false, message: "Invalid image type" });
        }

        if (groupPic.length > MAX_PIC_SIZE * 1.4) {
            return res.status(400).json({ success: false, message: "Image too large (max 5MB)" });
        }

        const updated = await Conversation.findByIdAndUpdate(
            groupId,
            { groupPic },
            { new: true }
        )
            .populate("participants", "fullname username profilepic")
            .populate("groupAdmin", "fullname username profilepic");

        io.to(`group:${groupId}`).emit("groupUpdated", updated);

        res.status(200).json({ success: true, group: updated });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Admin
export const updateGroupName = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { groupName } = req.body;
        const userId = req.user._id;

        const group = await Conversation.findOne({ _id: groupId, isGroup: true });

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        if (group.groupAdmin?.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the group admin can rename the group" });
        }

        if (!groupName || !groupName.trim()) {
            return res.status(400).json({ success: false, message: "Group name is required" });
        }

        const updated = await Conversation.findByIdAndUpdate(
            groupId,
            { groupName: groupName.trim() },
            { new: true }
        )
            .populate("participants", "fullname username profilepic")
            .populate("groupAdmin", "fullname username profilepic");

        io.to(`group:${groupId}`).emit("groupUpdated", updated);

        res.status(200).json({ success: true, group: updated });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const clearGroup = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        const group = await Conversation.findOne({
            _id: groupId,
            isGroup: true,
            participants: userId
        });

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Remove existing entry for this user
        await Conversation.findByIdAndUpdate(groupId, {
            $pull: { clearedBy: { userId } }
        });

        // Add fresh clear entry
        await Conversation.findByIdAndUpdate(groupId, {
            $push: { clearedBy: { userId, clearedAt: new Date() } }
        });

        res.status(200).json({ success: true, message: "Group cleared" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getGroupInfo = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        const group = await Conversation.findOne({
            _id: groupId,
            isGroup: true,
            participants: userId
        })
            .populate("participants", "fullname username profilepic")
            .populate("groupAdmin", "fullname username profilepic");

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        res.status(200).json({ success: true, group });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Add member(s) to group
export const addMember = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user?._id;

        // 1. Verify that the request is authenticated
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // 2. Validate the group ID
        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, message: "Invalid group ID format" });
        }

        // 3. Extract and normalize target member IDs (support memberId, userId, or members array)
        let targetMemberIds = [];
        if (req.body.memberId) {
            targetMemberIds = [req.body.memberId];
        } else if (req.body.userId) {
            targetMemberIds = [req.body.userId];
        } else if (Array.isArray(req.body.members) && req.body.members.length > 0) {
            targetMemberIds = req.body.members;
        }

        if (targetMemberIds.length === 0) {
            return res.status(400).json({ success: false, message: "Member ID is required" });
        }

        // Validate each target member ID format
        for (const mId of targetMemberIds) {
            if (!mId || !mongoose.Types.ObjectId.isValid(mId)) {
                return res.status(400).json({ success: false, message: "Invalid member ID format" });
            }
        }

        // 4 & 5. Find target group; return 404 if not found
        const group = await Conversation.findOne({ _id: groupId, isGroup: true });
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // 6 & 7. Verify requesting user is an administrator of that group
        const adminId = (group.groupAdmin?._id || group.groupAdmin)?.toString();
        if (!adminId || adminId !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only the group admin can add members" });
        }

        // 8. Prevent duplicate members
        const existingParticipantIds = new Set(
            group.participants.map(p => (p._id || p).toString())
        );
        const newMemberIds = targetMemberIds
            .map(id => id.toString())
            .filter(id => !existingParticipantIds.has(id));

        if (newMemberIds.length === 0) {
            return res.status(400).json({ success: false, message: "User is already a member of this group" });
        }

        // 9. Prevent invalid or unauthorized membership changes (verify target users exist)
        const foundUsers = await User.find({ _id: { $in: newMemberIds } }).select("_id");
        if (foundUsers.length !== newMemberIds.length) {
            return res.status(404).json({ success: false, message: "One or more target users do not exist" });
        }

        // 10. Concurrency-safe atomic conditional update verifying groupAdmin at write time
        const updated = await Conversation.findOneAndUpdate(
            {
                _id: groupId,
                isGroup: true,
                groupAdmin: userId
            },
            { $addToSet: { participants: { $each: newMemberIds } } },
            { new: true }
        )
            .populate("participants", "fullname username profilepic")
            .populate("groupAdmin", "fullname username profilepic");

        if (!updated) {
            // Safe recheck: determine whether group does not exist or user is no longer admin
            const groupExists = await Conversation.findOne({ _id: groupId, isGroup: true });
            if (!groupExists) {
                return res.status(404).json({ success: false, message: "Group not found" });
            }
            return res.status(403).json({ success: false, message: "Only the group admin can add members" });
        }

        if (io) {
            io.to(`group:${groupId}`).emit("groupUpdated", updated);
        }

        return res.status(200).json({
            success: true,
            message: "Member added successfully",
            group: updated
        });

    } catch (error) {
        console.error(`Error in addMember: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};