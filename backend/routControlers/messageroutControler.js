import Conversation from "../Models/conversationModels.js";
import Message from "../Models/messageSchema.js";
import { io, getReciverSocketId } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const { messages } = req.body;
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

        const newMessages = new Message({
            senderId,
            reciverId,
            message: messages,
            conversationId: chats._id
        });

        if (newMessages) {
            chats.messages.push(newMessages._id);
        }

        await Promise.all([chats.save(), newMessages.save()]);

        const receiverSocketId = getReciverSocketId(reciverId);
        if (receiverSocketId) {
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

        const query = { conversationId: conversation._id, isGroupMessage: false };
        if (clearedAt) {
            query.createdAt = { $gt: clearedAt };
        }

        const messages = await Message.find(query).sort({ createdAt: 1 });

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

        await Message.updateMany(
            { senderId: senderId, reciverId: receiverId, isRead: false },
            { $set: { isRead: true } }
        );

        const senderSocketId = getReciverSocketId(senderId);

        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { userId: receiverId });
        }

        res.status(200).json({ success: true, message: "Messages marked as read" });

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