import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullname:{
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true,
        unique:true
    },
    email:{
        type: String,
        required: true,
        unique:true
    },
    gender:{
        type: String,
        required: true,
        enum:["male","female"]
    },
    password:{
        type: String,
        required: true,
        minlength:6,
    },
    profilepic:{
        type: String,
        default:""
    },
    statusNote:{
        type: String,
        maxlength: 40,
        default: ""
    },
    lastSeen:{
        type: Date,
        default: null
    },
    vibeTags:{
        type: [String],
        default: [],
        validate: {
            validator: function(tags) {
                return !tags || (Array.isArray(tags) && tags.length <= 5);
            },
            message: "Cannot exceed 5 vibe tags"
        }
    },
    readReceipts:{
        type: Boolean,
        default: true
    },
    showLastSeen:{
        type: Boolean,
        default: true
    }
},{timestamps:true});

const User = mongoose.model("User",userSchema)

export default User;