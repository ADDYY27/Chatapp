import Message from "../Models/messageSchema.js";
import Conversation from "../Models/conversationModels.js";
import { io, getReciverSocketId } from "../socket/socket.js";

export const startScheduledMessageJob = () => {
    // Periodic worker to dispatch due scheduled messages
    setInterval(async () => {
        try {
            const now = new Date();
            const pendingMessages = await Message.find({
                isScheduled: true,
                scheduledFor: { $lte: now }
            }).populate({
                path: "replyTo",
                select: "message audioUrl senderId",
                populate: { path: "senderId", select: "fullname username" }
            });

            for (const msg of pendingMessages) {
                msg.isScheduled = false;
                const receiverSocketId = getReciverSocketId(msg.reciverId?.toString());
                if (receiverSocketId) {
                    msg.isDelivered = true;
                    msg.deliveredAt = new Date();
                }
                await msg.save();

                await Conversation.findByIdAndUpdate(msg.conversationId, {
                    $addToSet: { messages: msg._id }
                });

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newMessage", msg);
                }
                const senderSocketId = getReciverSocketId(msg.senderId?.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit("scheduledMessageDelivered", msg);
                }
            }
        } catch (err) {
            console.error("Scheduled message job error:", err);
        }
    }, 10000);
};
