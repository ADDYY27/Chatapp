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

    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default:[]
    },

},{timestamps:true})

const Message = mongoose.model("Message",messageSchema)

export default Message;