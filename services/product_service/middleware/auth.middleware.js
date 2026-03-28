require('dotenv').config();
const jwt = require('jsonwebtoken');

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

        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();
    } catch (error) {
        res.status(400).json({ status: 'error', code: 400, msg: 'Invalid token.', data: null });
    }
};

module.exports = auth;