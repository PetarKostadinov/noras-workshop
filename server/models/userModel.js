import mongoose, { Schema, Types } from "mongoose";

const EMAIL_PATTERN = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

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
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: false, required: true },
        itemsInCartDb: { type: Array, default: [] },
    },
    {
        timestamps: true
    },
);

userSchema.index({ email: 1 }, {
    collation: {
        locale: 'en',
        strength: 2
    }
});

const User = mongoose.model('User', userSchema);

export default User;
