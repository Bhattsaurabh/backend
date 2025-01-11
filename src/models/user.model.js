import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,         // cloudnery se url aara h
            required: true,
        },
        coverImage: {
            type: String,         // cloudnery se url aara h
        },
        watchHistory:   [ 
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:  "Video"       
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    
    {timestamps: true}
)


//making hash of your password
// only change if password modify
// yaha pe callback ki jagah "function" ka use issliye hua taki userSchema k field ka b access le ske "this" keyword se
// pre method kuch bhi "save" krne se pehle run hojyga
// pre method k pass purane or new password ka access hoga tabhi toh check kr payega {this.ismodify("password")}

userSchema.pre("save", async function (next)  {
    
    if(!this.ismodify("password"))    
        return next();
    this.password = bcrypt.hash(this.password, 10)
    next()
})


// check user input password
// user input password or hashed password ko compare krenge
// methods k pass sare data ka access hoga jese isme hashed password ka h (this.password)
// this se database ka data access kr skte h kisi methods k andar
userSchema.methods.isPasswordCorrect = async function (userInputpassword) {

   return await bcrypt.compare(userInputpassword, this.password)
}

//json web token is a type of key.
userSchema.methods.generateAccessToken = function(){
  return  jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return  jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema)