import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import admin from '../firebaseAdmin.js';
import { UserModel } from '../models/User.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// ─── Register ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await UserModel.findOne({ email });
    if (existing)
      return res.status(400).json({ error: 'An account with that email already exists.' });

    const user = await UserModel.create({ name, email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await UserModel.findOne({ email });
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Google OAuth Login ──────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google credential is required.' });

    const decodedToken = await admin.auth().verifyIdToken(credential);
    const { email, name, uid: googleId } = decodedToken;

    let user = await UserModel.findOne({ email });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = await UserModel.create({ name, email, googleId });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Current User ────────────────────────────────────────────────────────
router.get('/me', protect, async (req: AuthRequest, res) => {
  try {
    const user = await UserModel.findById(req.userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Forgot Password ─────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await UserModel.findOne({ email });
    if (!user)
      return res.status(404).json({ error: 'No account found with that email address.' });

    // Generate raw token and store its hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Return reset URL directly (dev mode / Option B)
    const resetUrl = `http://localhost:3000/reset-password/${rawToken}`;

    res.json({
      message: 'Password reset link generated successfully.',
      resetUrl,
      token: rawToken
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user)
      return res.status(400).json({ error: 'Reset link is invalid or has expired. Please request a new one.' });

    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({
      message: 'Password reset successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update Profile ──────────────────────────────────────────────────────────
router.put('/profile', protect, async (req: AuthRequest, res) => {
  try {
    const { name, password, currentPassword } = req.body;
    const user = await UserModel.findById(req.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (name) user.name = name;
    
    if (password) {
      if (user.password) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect current password.' });
        }
      }
      
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      user.password = password;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully.',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
