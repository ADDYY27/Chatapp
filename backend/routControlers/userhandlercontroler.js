import Conversation from "../Models/conversationModels.js";
import User from "../Models/userModels.js";
import Message from "../Models/messageSchema.js";

export const getUserBySearch=async(req,res)=>{
try {
    const search = req.query.search || '';
    const currentUserID = req.user._id;
   const users = await User.find({
    $and: [
        {
            $or: [
                { username: { $regex: search, $options: "i" } },
                { fullname: { $regex: search, $options: "i" } }
            ]
        },
        {
            _id: { $ne: currentUserID }
        }
    ]
}).select("fullname username profilepic statusNote lastSeen vibeTags showLastSeen").lean();

    const sanitizedUsers = users.map(u => ({
        ...u,
        lastSeen: u.showLastSeen !== false ? u.lastSeen : null
    }));

    res.status(200).send(sanitizedUsers);

} catch (error) {
    res.status(500).send({
        success: false,
        message: error
    })
    console.log(error);
}
}
export const getCorrentChatters = async (req, res) => {
    try {
        const currentUserID = req.user._id;

        const currentChatters = await Conversation.find({
            participants: currentUserID,
            isGroup: false,
            clearedBy: { $not: { $elemMatch: { userId: currentUserID } } }
        }).sort({ updatedAt: -1 });

        if (!currentChatters || currentChatters.length === 0) {
            return res.status(200).send([]);
        }

        const otherParticipantsIDs = currentChatters.reduce((ids, conversation) => {
            const otherParticipants = conversation.participants.filter(
                id => id.toString() !== currentUserID.toString()
            );
            return [...ids, ...otherParticipants];
        }, []);

        const users = await User.find({
            _id: { $in: otherParticipantsIDs }
        }).select("-password -email").lean();

        // Enrich each chatter with real unread count and last message
        const chattersWithMeta = await Promise.all(
            users.map(async (u) => {
                const conv = currentChatters.find((c) =>
                    c.participants.some((p) => p.toString() === u._id.toString())
                );
                const clearEntry = conv?.clearedBy?.find(
                    (c) => c.userId?.toString() === currentUserID.toString()
                );
                const clearedAt = clearEntry?.clearedAt || null;

                const query = {
                    senderId: u._id,
                    reciverId: currentUserID,
                    isRead: false
                };
                if (clearedAt) query.createdAt = { $gt: clearedAt };
                const unreadCount = await Message.countDocuments(query);

                const lastMsgQuery = {
                    conversationId: conv?._id,
                    isGroupMessage: false
                };
                if (clearedAt) lastMsgQuery.createdAt = { $gt: clearedAt };
                const lastMsg = await Message.findOne(lastMsgQuery)
                    .sort({ createdAt: -1 })
                    .select("message createdAt senderId isRead");

                return {
                    ...u,
                    lastSeen: u.showLastSeen !== false ? u.lastSeen : null,
                    unreadCount,
                    lastMessage: lastMsg ? lastMsg.message : "",
                    lastMessageTime: lastMsg ? lastMsg.createdAt : conv?.updatedAt
                };
            })
        );

        res.status(200).json(chattersWithMeta);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
}