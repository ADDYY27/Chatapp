import mongoose from "mongoose";
import Conversation from "../Models/conversationModels.js";
import Message from "../Models/messageSchema.js";
import { io, getReciverSocketId } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const { messages, audioUrl, audioDuration, replyTo, scheduledFor } = req.body;
        const { id: reciverId } = req.params;
        const senderId = req.user._id;

        let chats = await Conversation.findOne({
            participants: { $all: [senderId, reciverId] },
            isGroup: false
        });

        if (!chats) {
            chats = await Conversation.create({
                participants: [senderId, reciverId],
            });
        }
        const receiverSocketId = getReciverSocketId(reciverId);
        const isDelivered = !!receiverSocketId;
        const now = new Date();

        // Check disappearing message setting on conversation
        let expiresAt = null;
        if (chats.disappearingDuration === "1h") {
            expiresAt = new Date(now.getTime() + 3600000);
        } else if (chats.disappearingDuration === "24h") {
            expiresAt = new Date(now.getTime() + 86400000);
        }

        // Check schedule send
        let isScheduled = false;
        let scheduledDate = null;
        if (scheduledFor) {
            const parsed = new Date(scheduledFor);
            if (!isNaN(parsed.getTime()) && parsed > now) {
                isScheduled = true;
                scheduledDate = parsed;
            }
        }

        const newMessages = new Message({
            senderId,
            reciverId,
            message: messages || (audioUrl ? "🎤 Voice message" : ""),
            audioUrl: audioUrl || null,
            audioDuration: Number(audioDuration) || 0,
            replyTo: replyTo || null,
            conversationId: chats._id,
            isDelivered: isScheduled ? false : isDelivered,
            deliveredAt: !isScheduled && isDelivered ? now : null,
            isRead: false,
            readAt: null,
            isScheduled,
            scheduledFor: scheduledDate,
            expiresAt
        });

        if (!isScheduled) {
            chats.messages.push(newMessages._id);
        }

        await Promise.all([chats.save(), newMessages.save()]);

        if (replyTo) {
            await newMessages.populate({
                path: "replyTo",
                select: "message audioUrl senderId",
                populate: { path: "senderId", select: "fullname username" }
            });
        }

        if (!isScheduled && receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessages);
        }

        res.status(201).json(newMessages);

    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: reciverId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, reciverId] },
            isGroup: false
        });

        if (!conversation) {
            return res.status(200).json([]);
        }

        // Check if current user cleared this chat
        const clearEntry = conversation.clearedBy?.find(
            (c) => c.userId?.toString() === senderId.toString()
        );
        const clearedAt = clearEntry?.clearedAt || null;

        const now = new Date();
        const query = {
            conversationId: conversation._id,
            isGroupMessage: false,
            isScheduled: { $ne: true },
            deletedFor: { $ne: senderId },
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: now } }
            ]
        };
        if (clearedAt) {
            query.createdAt = { $gt: clearedAt };
        }

        // Mark incoming messages as delivered when fetched
        await Message.updateMany(
            { senderId: reciverId, reciverId: senderId, isDelivered: false },
            { $set: { isDelivered: true, deliveredAt: now } }
        );

        const messages = await Message.find(query)
            .sort({ createdAt: 1 })
            .populate({
                path: "replyTo",
                select: "message audioUrl senderId",
                populate: { path: "senderId", select: "fullname username" }
            });

        res.status(200).json(messages);

    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const { id: senderId } = req.params;
        const receiverId = req.user._id;
        const now = new Date();

        await Message.updateMany(
            { senderId: senderId, reciverId: receiverId, isRead: false },
            { $set: { isRead: true, isDelivered: true, readAt: now } }
        );

        const senderSocketId = getReciverSocketId(senderId);

        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { userId: receiverId, readAt: now });
        }

        res.status(200).json({ success: true, message: "Messages marked as read", readAt: now });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
};

export const clearChat = async (req, res) => {
    try {
        const { id: otherId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherId] },
            isGroup: false
        });

        if (!conversation) {
            return res.status(200).json({ success: true, message: "No conversation found" });
        }

        // Remove existing entry for this user
        await Conversation.findByIdAndUpdate(conversation._id, {
            $pull: { clearedBy: { userId } }
        });

        // Add fresh clear entry
        await Conversation.findByIdAndUpdate(conversation._id, {
            $push: { clearedBy: { userId, clearedAt: new Date() } }
        });

        res.status(200).json({ success: true, message: "Chat cleared" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
};

export const toggleReaction = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        if (!emoji) {
            return res.status(400).json({ message: "Emoji is required" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const conversation = await Conversation.findById(message.conversationId);
        if (!conversation || !conversation.participants.some(p => p.toString() === userId.toString())) {
            return res.status(403).json({ message: "Not authorized to react to this message" });
        }

        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            message.reactions.push({ emoji, userId });
        }

        await message.save();

        const payload = {
            messageId: message._id,
            conversationId: message.conversationId,
            reactions: message.reactions
        };

        conversation.participants.forEach(pId => {
            const socketId = getReciverSocketId(pId.toString());
            if (socketId) {
                io.to(socketId).emit("messageReaction", payload);
            }
        });

        res.status(200).json({ success: true, reactions: message.reactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};

export const togglePinMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const conversation = await Conversation.findById(message.conversationId);
        if (!conversation || !conversation.participants.some(p => p.toString() === userId.toString())) {
            return res.status(403).json({ message: "Not authorized" });
        }

        message.isPinned = !message.isPinned;
        message.pinnedAt = message.isPinned ? new Date() : null;
        message.pinnedBy = message.isPinned ? userId : null;

        await message.save();

        const payload = {
            messageId: message._id,
            conversationId: message.conversationId,
            isPinned: message.isPinned,
            pinnedAt: message.pinnedAt,
            pinnedBy: message.pinnedBy
        };

        conversation.participants.forEach(pId => {
            const socketId = getReciverSocketId(pId.toString());
            if (socketId) {
                io.to(socketId).emit("messagePinned", payload);
            }
        });

        res.status(200).json({ success: true, isPinned: message.isPinned, message });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};

export const deleteForMe = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const conversation = await Conversation.findById(message.conversationId);
        if (!conversation || !conversation.participants.some(p => p.toString() === userId.toString())) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (!message.deletedFor.some(id => id.toString() === userId.toString())) {
            message.deletedFor.push(userId);
            await message.save();
        }

        res.status(200).json({ success: true, messageId: message._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};

export const setDisappearingDuration = async (req, res) => {
    try {
        const { id: otherOrConvId } = req.params;
        const { duration } = req.body;
        const userId = req.user._id;

        if (!["off", "1h", "24h"].includes(duration)) {
            return res.status(400).json({ message: "Invalid duration. Choose 'off', '1h', or '24h'." });
        }

        let conversation = await Conversation.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(otherOrConvId) ? otherOrConvId : null },
                { participants: { $all: [userId, otherOrConvId] }, isGroup: false }
            ]
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, otherOrConvId],
                disappearingDuration: duration
            });
        } else {
            conversation.disappearingDuration = duration;
            await conversation.save();
        }

        res.status(200).json({ success: true, disappearingDuration: conversation.disappearingDuration });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};