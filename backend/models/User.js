const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide name'],
        minlength: 3,
        maxlength: 50
    },

    email:{
        type: String,
        required: [true, "Please provide email"],
        minlength: 3,
        maxlength: 50,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
          ],
          unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: 3
    },
    googleId: {
        type: String,
        sparse: true // Allow multiple null values but ensure uniqueness when not null
    },
    profilePicture: {
        type: String,
        default: null
    },
    provider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    role: {
        type: String,
        enum: ['user', 'superuser'],
        default: 'user'
    },
    // Google Analytics integration
    googleAnalytics: {
        accessToken: {
            type: String,
            default: null
        },
        refreshToken: {
            type: String,
            default: null
        },
        tokenExpiresAt: {
            type: Date,
            default: null
        },
        propertyId: {
            type: String,
            default: null
        },
        searchConsoleUrl: {
            type: String,
            default: null
        },
        connectedAt: {
            type: Date,
            default: null
        }
    },
});

UserSchema.pre("save", async function(){
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})



UserSchema.methods.comparePassword = async function(candidatePassword){
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
}

module.exports = mongoose.model("User", UserSchema);