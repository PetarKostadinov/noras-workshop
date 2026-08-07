import express from "express";
import User from "../models/userModel.js";
import bcrypt from 'bcryptjs';

import expressAsyncHandler from 'express-async-handler';
import { auth, createRateLimiter, generateToken } from "../utils.js";


const userRouter = express.Router();
const accountRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many account requests. Please wait a few minutes and try again.',
});

userRouter.post('/login', accountRateLimiter, expressAsyncHandler(async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const user = email && password ? await User.findOne({ email }).select('+password') : null;
    if (user) {
        if (await bcrypt.compare(password, user.password)) {
            res.send({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                token: generateToken(user)
            });
            return;
        }
    }

    res.status(401).send({ message: 'Invalid email or password', status: 401 });
}));

userRouter.post('/register', accountRateLimiter, expressAsyncHandler(async (req, res) => {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!username || !email || !password) {
        res.status(400).send({ message: 'Name, email, and password are required' });
        return;
    }

    if (password.length < 6) {
        res.status(400).send({ message: 'Password must be at least 6 characters' });
        return;
    }

    const existingUser = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (existingUser) {
        res.status(409).send({ message: 'An account with this email already exists' });
        return;
    }

    const newUser = new User({
        username,
        email,
        password: await bcrypt.hash(password, 10)
    });
    const user = await newUser.save();
    res.send({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user)
    });

}));

userRouter.put('/profile', auth, expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const username = req.body.username?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;
        if (!username || !email) {
            return res.status(400).send({ message: 'Name and email are required' });
        }
        if (password && password.length < 6) {
            return res.status(400).send({ message: 'Password must be at least 6 characters' });
        }

        const emailExists = await User.findOne({
            _id: { $ne: user._id },
            email,
        }).collation({ locale: 'en', strength: 2 });
        if (emailExists) {
            return res.status(409).send({ message: 'An account with this email already exists' });
        }

        user.username = username;
        user.email = email;
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await user.save();
        res.send({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            token: generateToken(updatedUser)
        });

    } else {
        res.status(404).send({ message: 'We could not find that account.' })
    }
}));



export default userRouter;
