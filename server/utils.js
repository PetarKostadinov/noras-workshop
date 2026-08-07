import jwt from 'jsonwebtoken';
import User from './models/userModel.js';

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    if (authorization?.startsWith('Bearer ')) {
        const token = authorization.slice(7);
        jwt.verify(
            token,
            process.env.JWT_SECRET,
            (err, decode) => {
                if (err) {
                    res.status(401).send({ message: 'Your session is no longer valid. Please sign in again.' });
                } else {
                    req.user = decode;
                    next();
                }
            }
        );
    } else {
        res.status(401).send({ message: 'Please sign in to continue.' });
    }
};

export const createRateLimiter = ({ windowMs, max, message }) => {
    const requests = new Map();

    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of requests) {
            if (entry.resetAt <= now) requests.delete(key);
        }
    }, windowMs);
    cleanup.unref();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip;
        const current = requests.get(key);
        const entry = !current || current.resetAt <= now
            ? { count: 1, resetAt: now + windowMs }
            : { ...current, count: current.count + 1 };

        requests.set(key, entry);
        if (entry.count > max) {
            res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
            return res.status(429).send({ message });
        }
        next();
    };
};

export const admin = (req, res, next) => {
    User.findById(req.user?._id).select('isAdmin')
        .then((user) => {
            if (!user?.isAdmin) {
                res.status(403).send({ message: 'Administrator access is required for this action.' });
                return;
            }
            next();
        })
        .catch(next);
};



