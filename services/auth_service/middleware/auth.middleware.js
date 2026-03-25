require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ status: 'error', code: 401, msg: 'Access denied. No token provided.', data: null });
    }
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ status: 'error', code: 500, msg: 'JWT configuration missing.', data: null });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const foundUser = await User.findById(decoded.userId);

        if (!foundUser) {
            return res.status(401).json({ status: 'error', code: 401, msg: 'User not found.', data: null });
        }

        if (!foundUser.is_verified) {
            return res.status(403).json({ status: 'error', code: 403, msg: 'Email not verified.', data: null });
        }

        req.user = {
            userId: decoded.userId,
            role: foundUser.role
        };

        next();
    } catch (error) {
        res.status(400).json({ status: 'error', code: 400, msg: 'Invalid token.', data: null });
    }
};

module.exports = auth;