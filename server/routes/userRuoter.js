import express from "express";
import User from "../models/userModel.js";
import bcrypt from 'bcryptjs';

import expressAsyncHandler from 'express-async-handler';
import { auth, generateToken } from "../utils.js";


const userRouter = express.Router();

userRouter.post('/login', expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
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

userRouter.post('/register', expressAsyncHandler(async (req, res) => {
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
        password: bcrypt.hashSync(password)
    });
    const user = await newUser.save();
    res.send({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        itemsInCartDb: user.itemsInCartDb,
        token: generateToken(user)
    });

}));

userRouter.put('/profile', auth, expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {

        const emailExists = await User.findOne({ email: req.body.email });

        if (emailExists) {
            res.send({ message: 'Email exists!', status: 409 });
        }

        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.password = req.body.password || user.password;
        user.repass = req.body.repass || user.repass;
        if (req.body.password) {
            user.password = bcrypt.hashSync(req.body.password, 8);
        }

        const updatedUser = await user.save();
        res.send({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            password: updatedUser.password,
            repass: updatedUser.repass,
            isAdmin: updatedUser.isAdmin,
            token: generateToken(updatedUser)
        });

    } else {
        res.status(404).send({ message: 'User Not Found' })
    }
}));



export default userRouter;
