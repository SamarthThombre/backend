import mongoose, {Schema}  from "mongoose";
import  bcrypt from 'bcrypt';
import  jwt from 'jsonwebtoken';

const userSchema = new Schema({
    username: {
        type: String,
        required:true,
        unique:true,
        lowercase: true,
        trim:true,
        index:true,
    },

    email: {
        type: String,
        required:true,
        unique:true,
        lowercase: true,
        trim:true,
    },

    fullName: {
        type: String,
        required:true,
        trim:true,
        index:true,
    },


    avatar:{
        type: String,
        required: true,
    },

    coverImage:{
        type: String,

    },

    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video',
        }
    ],

    password : {
        type: String,
        required: [true,  'Please enter a password'],

    },

    refressToken :{
        type:String
    }


},{
    timestamps:true,
})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next()

    this.password = bcrypt.hash(this.password, 10)
    next()
} )

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.method.genrateAccessToken = function (){
    return jwt.sign(
        {
            id:this._id,
            email:  this.email,
            username: this.username,
            fullName:  this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: process.env.CESS_TOKEN_EXPIRY
        }
    )
}

userSchema.method.genrateAccessToken = function ()


export const User = mongoose.model("User", userSchema)