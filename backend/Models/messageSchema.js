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

    message:{
        type:String,
        required:true
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