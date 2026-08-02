import jwt from 'jsonwebtoken';
import User from './models/userModel.js';

export const generateToken = (user) => {
    return jwt.sign(
        {
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '30d'
        })
};

export const auth = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (authorization) {
        const token = authorization.slice(7, authorization.length); //Bearer XXXXXX
        jwt.verify(
            token,
            process.env.JWT_SECRET,
            (err, decode) => {
                if (err) {
                    res.status(401).send({ message: 'Invalid Token' });
                } else {
                    req.user = decode;
                    next();
                }
            }
        );
    } else {
        res.status(401).send({ message: 'No Token' });
    }
};

export const admin = (req, res, next) => {
    User.findById(req.user?._id).select('isAdmin')
        .then((user) => {
            if (!user?.isAdmin) {
                res.status(403).send({ message: 'Admin access required' });
                return;
            }
            next();
        })
        .catch(next);
};



