require('dotenv').config();
const user = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    // Registration logic
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'Name, email and password are required', data: null });
    }
    if (await user.findOne({ email })) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'Email already exists', data: null });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new user({ name, email, password_hash: hashedPassword });
    await newUser.save();
    res.status(201).json({ status: 'success', code: 201, msg: 'User registered successfully', data: newUser });
};

exports.login = async (req, res) => {
    // Login logic
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'Email and password are required', data: null });
    }
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'Invalid email or password', data: null });
    }
    const isPasswordValid = await bcrypt.compare(password, existingUser.password_hash);
    if (!isPasswordValid) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'Invalid email or password', data: null });
    }
    // Generate JWT token logic here
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ status: 'error', code: 500, msg: 'JWT configuration missing', data: null });
    }

    const token = jwt.sign(
        { userId: existingUser._id, role: existingUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '1h' }
    );

    res.status(200).json({ status: 'success', code: 200, msg: 'Login successful', data: { userId: existingUser._id, token } });
};

exports.sendVerificationEmail = async (req, res) => {
    // Send verification email logic
    const { email } = req.body;
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'User not found', data: null });
    }
    // Implementation for sending verification email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    existingUser.otp = otp;
    existingUser.otp_expiry = Date.now() + 3600000; // OTP valid for 1 hour
    await existingUser.save();
    // Logic to send email with OTP goes here
    res.status(200).json({ status: 'success', code: 200, msg: 'Verification email sent', data: null });
};

exports.verifyEmail = async (req, res) => {
    // Email verification logic
    const { email, otp } = req.body;
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'User not found', data: null });
    }
    if (existingUser.otp !== otp || existingUser.otp_expiry < Date.now()) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'Invalid or expired OTP', data: null });
    }
    existingUser.is_verified = true;
    existingUser.otp = null;
    existingUser.otp_expiry = null;
    await existingUser.save();
    res.status(200).json({ status: 'success', code: 200, msg: 'Email verified successfully', data: null });
};

exports.requestPasswordReset = async (req, res) => {
    // Password reset request logic
    const { email } = req.body;
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'User not found', data: null });
    }
    // Implementation for sending password reset email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    existingUser.otp = otp;
    existingUser.otp_expiry = Date.now() + 3600000; // OTP valid for 1 hour
    await existingUser.save();
    // Logic to send email with OTP goes here
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${email}&otp=${otp}`;
    // Logic to send email with resetLink goes here
    res.status(200).json({ status: 'success', code: 200, msg: 'Password reset email sent', data: null });
};

exports.resetPassword = async (req, res) => {
    // Password reset logic
    const { email, otp, newPassword } = req.body;
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'User not found', data: null });
    }
    if (existingUser.otp !== otp || existingUser.otp_expiry < Date.now()) {
        return res.status(400).json({ status: 'error', code: 400, msg: 'Invalid or expired OTP', data: null });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    existingUser.password_hash = hashedPassword;
    existingUser.otp = null;
    existingUser.otp_expiry = null;
    await existingUser.save();
    res.status(200).json({ status: 'success', code: 200, msg: 'Password reset successful', data: null });
};

exports.getProfile = async (req, res) => {
    // Get user profile logic
    const { userId } = req.user; // Assuming userId is set in req.user by authentication middleware
    const foundUser = await user.findById(userId);
    if (!foundUser) {
        return res.status(404).json({ status: 'error', code: 404, msg: 'User not found', data: null });
    }
    res.status(200).json({ status: 'success', code: 200, msg: 'Profile retrieved successfully', data: foundUser });
};

exports.updateProfile = async (req, res) => {
    // Update user profile logic
    const { userId } = req.user; // Assuming userId is set in req.user by authentication middleware
    const { name } = req.body;
    const foundUser = await user.findById(userId);
    if (!foundUser) {
        return res.status(404).json({ status: 'error', code: 404, msg: 'User not found', data: null });
    }
    if (name) foundUser.name = name;
    await foundUser.save();
    res.status(200).json({ status: 'success', code: 200, msg: 'Profile updated successfully', data: foundUser });
};

exports.deleteProfile = async (req, res) => {
    // Delete user account logic
    const { userId } = req.user; // Assuming userId is set in req.user by authentication middleware
    const foundUser = await user.findById(userId);
    if (!foundUser) {
        return res.status(404).json({ status: 'error', code: 404, msg: 'User not found', data: null });
    }
    await user.findByIdAndUpdate(userId, { $set: { is_verified: false } });
    res.status(200).json({ status: 'success', code: 200, msg: 'Account deleted successfully', data: null });
};