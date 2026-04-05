import Conversation from "../Models/conversationModels.js";
import User from "../Models/userModels.js";

export const getUserBySearch=async(req,res)=>{
try {
    const search = req.query.search || '';
    const currentUserID = req.user._id;
    const user = await User.find({
        $and:[
            {
                $or:[
                    {username:{$regex:'.*'+search+'.*',$options:'i'}},
                    {fullname:{$regex:'.*'+search+'.*',$options:'i'}}
                ]
            },{
                _id:{$ne:currentUserID}
            }
        ]
    }).select("-password").select("email")

    res.status(200).send(user)

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
        const currentUserID = req.user._id; // fix: _conditions._id → _id

        const currentChatters = await Conversation.find({
            participants: currentUserID
        }).sort({ updatedAt: -1 });

        if (!currentChatters || currentChatters.length === 0) {
            return res.status(200).send([]);
        }

        const otherParticipantsIDs = currentChatters.reduce((ids, conversation) => {
            const otherParticipants = conversation.participants.filter(
                id => id.toString() !== currentUserID.toString() // fix: !== string compare
            );
            return [...ids, ...otherParticipants];
        }, []);

        const users = await User.find({ 
            _id: { $in: otherParticipantsIDs } 
        }).select("-password -email");

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
}