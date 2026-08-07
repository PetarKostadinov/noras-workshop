import mongoose, { Schema, Types } from "mongoose";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new Schema(
    {
        username: { type: String, required: true, trim: true },
        email: {
            type: String, required: true, trim: true, lowercase: true, validate: {
                validator(value) {
                    return EMAIL_PATTERN.test(value);
                },
                message: 'Invalid Email'
            }
        },
        password: { type: String, required: true, select: false },
        isAdmin: { type: Boolean, default: false, required: true },
    },
    {
        timestamps: true
    },
);

userSchema.index({ email: 1 }, {
    unique: true,
    collation: {
        locale: 'en',
        strength: 2
    }
});

const User = mongoose.model('User', userSchema);

export default User;
