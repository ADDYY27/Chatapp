// import Conversation from "../Models/conversationModels.js";
// import Message from "../Models/messageSchema.js";

// export const sendMessage = async (req, res) => {
//     try {
//         const { messages } = req.body;
//         const { id: reciverId } = req.params;
//         const senderId = req.user._id;

//         let chats = await Conversation.findOne({
//             participants: { $all: [senderId, reciverId] }
//         });

//         if (!chats) {
//             chats = await Conversation.create({
//                 participants: [senderId, reciverId],
//             });
//         }

//         const newMessages = new Message({
//             senderId,
//             reciverId,
//             message: messages,
//             conversationId: chats._id
//         });

//         if (newMessages) {
//             chats.messages.push(newMessages._id);
//         }

//         await Promise.all([chats.save(), newMessages.save()]);

//         res.status(201).json(newMessages);

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//         console.log(error);
//     }
// };

// export const getMessages = async (req, res) => {
//     try {
//         const { id: reciverId } = req.params;
//         const senderId = req.user._id;

//         const conversation = await Conversation.findOne({
//             participants: { $all: [senderId, reciverId] }
//         }).populate("messages");

//         if (!conversation) {
//             return res.status(200).json([]);
//         }

//         res.status(200).json(conversation.messages);

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//         console.log(error);
//     }
// };




import Conversation from "../Models/conversationModels.js";
import Message from "../Models/messageSchema.js";
import { io, getReciverSocketId } from "../socket/socket.js"; // ✅ this was missing

export const sendMessage = async (req, res) => {
    try {
        const { messages } = req.body;
        const { id: reciverId } = req.params;
        const senderId = req.user._id;

        let chats = await Conversation.findOne({
            participants: { $all: [senderId, reciverId] }
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

        // ✅ emit to receiver in real time
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
            participants: { $all: [senderId, reciverId] }
        }).populate("messages");

        if (!conversation) {
            return res.status(200).json([]);
        }

        res.status(200).json(conversation.messages);

    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};