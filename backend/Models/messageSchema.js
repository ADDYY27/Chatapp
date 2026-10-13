import mongoose from "mongoose"

const messageSchema = mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    reciverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null
    },

    isGroupMessage: {
        type: Boolean,
        default: false
    },

    message: {
        type: String,
        default: ""
    },

    audioUrl: {
        type: String,
        default: null
    },

    audioDuration: {
        type: Number,
        default: 0
    },

    reactions: [
        {
            emoji: { type: String, required: true },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
        }
    ],

    isPinned: {
        type: Boolean,
        default: false
    },

    pinnedAt: {
        type: Date,
        default: null
    },

    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },

    deletedFor: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    isScheduled: {
        type: Boolean,
        default: false
    },

    scheduledFor: {
        type: Date,
        default: null
    },

    expiresAt: {
        type: Date,
        default: null
    },

    isRead: {
        type: Boolean,
        default: false
    },

    readAt: {
        type: Date,
        default: null
    },

    isDelivered: {
        type: Boolean,
        default: false
    },

    deliveredAt: {
        type: Date,
        default: null
    },

    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default: null
    },

},{timestamps:true})

const Message = mongoose.model("Message",messageSchema)

export default Message;