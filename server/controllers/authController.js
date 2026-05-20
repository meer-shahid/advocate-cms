const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, firmName, role, barCouncilNumber } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const user = await User.create({ name, email, password, phone, firmName, role, barCouncilNumber });

        // Welcome notification
        await Notification.create({
            userId: user._id,
            title: 'Welcome to Advocate CMS!',
            message: `Welcome, ${user.name}! Your account has been created successfully.`,
            type: 'System'
        });

        const token = generateToken(user._id);
        const userData = { _id: user._id, name: user.name, email: user.email, role: user.role, firmName: user.firmName, phone: user.phone, theme: user.theme };

        res.status(201).json({ success: true, message: 'Account created successfully.', token, user: userData });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);
        const userData = { _id: user._id, name: user.name, email: user.email, role: user.role, firmName: user.firmName, phone: user.phone, avatar: user.avatar, theme: user.theme };

        res.status(200).json({ success: true, message: 'Login successful.', token, user: userData });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, firmName, barCouncilNumber, specialization, address, theme } = req.body;
        const updateData = { name, phone, firmName, barCouncilNumber, specialization, address, theme };

        if (req.file) {
            updateData.avatar = req.file.filename;
        }

        const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: 'Profile updated successfully.', user });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        user.password = newPassword;
        await user.save();
        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
