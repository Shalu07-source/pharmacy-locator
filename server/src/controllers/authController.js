import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Removed sendEmail import since we skip email verification
// import sendEmail from "../utils/sendEmail.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email
  };
}

// ✅ SIGNUP (auto-verify user, skip email)
export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // ✅ Auto-verify new user, skip email sending
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isVerified: true  // auto-verify
    });

    // Skip sending verification email
    // (Commented out since email verification is disabled)
    // const verificationLink = `${process.env.API_BASE_URL}/api/auth/verify/${verificationToken}`;
    // await sendEmail(user.email, "Verify your account", `<a href="${verificationLink}">Verify</a>`);

    return res.status(201).json({
      message: 'Registered successfully',
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('Signup failed', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ✅ SIGNIN (no change needed for auto-verified users)
export async function signin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // No need to check user.isVerified because we auto-verified users at signup

    // ✅ Compare password
    const passwordMatches = await bcrypt.compare(password.trim(), user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user._id);
    return res.json({
      message: 'Successfully Signed In',
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('Signin failed', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ✅ VERIFY EMAIL (Not used because email verification is skipped)
export async function verifyEmail(req, res) {
  // This endpoint will no longer be reached since we skip sending tokens.
  return res.status(404).send('<h2>Verification is disabled</h2>');
}

// ✅ PROFILE
export async function getProfile(req, res) {
  return res.json({ user: toPublicUser(req.user) });
}
