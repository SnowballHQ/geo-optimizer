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
        minlength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function(password) {
                // Password strength validation: at least one uppercase, lowercase, number, and special character
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
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
    // Account security features
    accountLocked: {
        type: Boolean,
        default: false
    },
    lockUntil: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    lastLoginIP: {
        type: String,
        default: null
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

    // Stripe payment integration
    stripeCustomerId: {
        type: String,
        sparse: true,
        default: null
    },
    subscriptionStatus: {
        type: String,
        enum: ['none', 'active', 'canceled', 'past_due', 'unpaid', 'incomplete'],
        default: 'none'
    },
    subscriptionId: {
        type: String,
        sparse: true,
        default: null
    },
    planType: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
    },
    paymentHistory: [{
        paymentIntentId: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'usd'
        },
        status: {
            type: String,
            enum: ['succeeded', 'pending', 'failed', 'canceled'],
            required: true
        },
        planType: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    billingAddress: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postal_code: String,
        country: String
    },
    paymentMethodId: {
        type: String,
        sparse: true,
        default: null
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

// Virtual property for checking if account is locked
UserSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Account lockout methods
UserSchema.statics.getAuthenticated = async function(email, password, clientIP) {
    const user = await this.findOne({ email: email });
    
    if (!user) {
        return { success: false, message: 'Invalid email or password' };
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
        const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        return { 
            success: false, 
            message: `Account is locked. Try again in ${lockTimeRemaining} minutes.`,
            locked: true 
        };
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (isMatch) {
        // If there was no lock or we're past the lock time, reset attempts
        if (user.loginAttempts && user.loginAttempts > 0) {
            user.loginAttempts = 0;
            user.accountLocked = false;
            user.lockUntil = undefined;
        }
        
        // Update last login info
        user.lastLoginAt = new Date();
        user.lastLoginIP = clientIP;
        await user.save();
        
        return { success: true, user: user };
    }

    // Password is incorrect, increment login attempts
    user.loginAttempts += 1;

    // If we have reached max attempts and account isn't already locked, lock it
    const maxAttempts = 5;
    const lockTime = 15 * 60 * 1000; // 15 minutes
    
    if (user.loginAttempts >= maxAttempts && !user.isLocked) {
        user.accountLocked = true;
        user.lockUntil = Date.now() + lockTime;
        await user.save();
        
        return { 
            success: false, 
            message: `Account locked due to too many failed login attempts. Try again in 15 minutes.`,
            locked: true 
        };
    }

    await user.save();
    
    const attemptsLeft = maxAttempts - user.loginAttempts;
    return { 
        success: false, 
        message: `Invalid email or password. ${attemptsLeft} attempts remaining.`,
        attemptsLeft: attemptsLeft 
    };
};

// Reset account lockout
UserSchema.methods.resetLockout = async function() {
    this.loginAttempts = 0;
    this.accountLocked = false;
    this.lockUntil = undefined;
    await this.save();
};

module.exports = mongoose.model("User", UserSchema);