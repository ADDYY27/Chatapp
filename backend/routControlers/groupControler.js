import Conversation from "../Models/conversationModels.js";
import User from "../Models/userModels.js";
import Message from "../Models/messageSchema.js";
import { io } from "../socket/socket.js";

export const createGroup = async (req, res) => {
    try {
        const { groupName, members } = req.body;
        const adminId = req.user._id;

        // Basic validation
        if (!groupName || !groupName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Group name is required"
            });
        }

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Select at least one member"
            });
        }

        // Remove duplicate members and add admin
        const participantIds = [
            ...new Set([
                adminId.toString(),
                ...members.map((id) => id.toString())
            ])
        ];

        // Check that all selected users actually exist
        const users = await User.find({
            _id: { $in: participantIds }
        }).select("_id");

        if (users.length !== participantIds.length) {
            return res.status(400).json({
                success: false,
                message: "One or more selected users do not exist"
            });
        }

        // Create group conversation
        const group = await Conversation.create({
            participants: participantIds,
            isGroup: true,
            groupName: groupName.trim(),
            groupAdmin: adminId
        });

        const populatedGroup = await Conversation.findById(group._id)
            .populate("participants", "fullname username profilepic")
            .populate("groupAdmin", "fullname username profilepic");

        res.status(201).json({
            success: true,
            message: "Group created successfully",
            group: populatedGroup
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Conversation.find({
            participants: userId,
            isGroup: true
        })
            .populate("participants", "fullname username profilepic")
            .populate("groupAdmin", "fullname username profilepic")
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            groups
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
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
            return res.status(404).json({
                success: false,
                message: "Group not found or access denied"
            });
        }

        const messages = await Message.find({
            conversationId: groupId,
            isGroupMessage: true
        })
            .populate(
                "senderId",
                "fullname username profilepic"
            )
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            messages
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const sendGroupMessage = async (req, res) => {
    try {
        console.log("SEND GROUP MESSAGE CALLED");

        const { id: groupId } = req.params;
        const { message } = req.body;
        const senderId = req.user._id;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty"
            });
        }

        // Check whether sender is a member of the group
        const group = await Conversation.findOne({
            _id: groupId,
            isGroup: true,
            participants: senderId
        });

        console.log("GROUP FOUND:", group);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found or access denied"
            });
        }

        // Create message
        const newMessage = await Message.create({
            senderId: senderId,
            reciverId: null,
            message: message.trim(),
            conversationId: groupId,
            isGroupMessage: true
        });

        console.log("MESSAGE CREATED:", newMessage._id);

        // Add message to group conversation
        await Conversation.findByIdAndUpdate(
            groupId,
            {
                $push: {
                    messages: newMessage._id
                }
            }
        );

        // Get sender details
        const populatedMessage = await Message.findById(
            newMessage._id
        ).populate(
            "senderId",
            "fullname username profilepic"
        );

        // Send real-time message to group members
        console.log("EMITTING GROUP MESSAGE:", groupId);

        io.to(`group:${groupId}`).emit(
            "groupMessage",
            populatedMessage
        );

        res.status(201).json({
            success: true,
            message: populatedMessage
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};