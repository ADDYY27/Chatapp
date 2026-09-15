import mongoose from "mongoose";

const conversationSchema = mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message",
                default: [],
            },
        ],

        // Group chat fields
        isGroup: {
            type: Boolean,
            default: false,
        },

        groupName: {
            type: String,
            default: "",
        },

        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

const Conversation = mongoose.model(
    "Conversation",
    conversationSchema
);

export default Conversation;