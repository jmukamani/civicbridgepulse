import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";
import { Op } from "sequelize";

dotenv.config();

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      county: user.county,
      ward: user.ward,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - county
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [citizen, representative, admin]
 *                 default: citizen
 *               county:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful, verification email sent
 *       400:
 *         description: Validation error or email already exists
 *       500:
 *         description: Server error
 */

// Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, county, specializations, verificationDocs } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // Handle different user role registrations
    let userData = { 
      name, 
      email, 
      password: hashed, 
      role: role || "citizen", 
      county 
    };

    if (role === "representative") {
      userData.verificationStatus = "pending";
      userData.isRepVerified = false;
      userData.specializations = specializations || [];
      userData.verificationDocs = verificationDocs ? JSON.stringify(verificationDocs) : null;
    } else if (role === "admin") {
      // Admin accounts are automatically verified
      userData.isVerified = true;
      userData.isRepVerified = true;
      userData.verificationStatus = "not_required";
    }

    const user = await User.create(userData);

    // Send verification email (except for admin accounts which are auto-verified)
    const token = generateToken(user);
    
    if (role === "admin") {
      // Admin accounts don't need email verification
      user.isVerified = true;
      await user.save();
    } else if (/^testuser_.*@example\.com$/.test(email)) {
      // Test users: skip sending email, auto-verify
      user.isVerified = true;
      await user.save();
    } else {
      const verifyUrl = `${process.env.CLIENT_URL}/verify?token=${token}`;
      let emailMessage = `<p>Hi ${name}, please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p>`;
      
      if (role === "representative") {
        emailMessage += `<p><strong>Note:</strong> As a representative, your account will require admin approval before you can access all features. You will be notified once your account is verified.</p>`;
      }

      await sendEmail(email, "Verify your email", emailMessage);
    }

    let responseMessage = "Registration successful";
    if (role === "admin") {
      responseMessage += ". Admin account is ready to use.";
    } else if (role === "representative") {
      responseMessage += ", please check your email. Representative accounts require admin verification.";
    } else {
      responseMessage += ", please check your email";
    }

    res.status(201).json({ message: responseMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify user email address
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */

// Email Verification
router.get("/verify", async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid credentials or email not verified
 *       500:
 *         description: Server error
 */

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Check email verification (admin accounts are auto-verified)
    if (!user.isVerified && user.role !== "admin") {
      return res.status(400).json({ message: "Please verify your email first" });
    }

    // Check representative verification status
    if (user.role === "representative") {
      if (user.verificationStatus === "pending") {
        return res.status(400).json({ 
          message: "Your representative account is pending admin verification. Please wait for approval." 
        });
      }
      if (user.verificationStatus === "rejected") {
        return res.status(400).json({ 
          message: "Your representative account has been rejected. Please contact support." 
        });
      }
      if (!user.isRepVerified) {
        return res.status(400).json({ 
          message: "Your representative account requires verification. Please contact admin." 
        });
      }
    }

    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Email not found
 *       500:
 *         description: Server error
 */

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const html = `<p>Reset your password by clicking the link below:</p><p><a href="${resetUrl}">Reset Password</a></p>`;
    await sendEmail(email, "Password Reset", html);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */

// Reset password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({ where: { passwordResetToken: token, passwordResetExpires: { [Op.gt]: Date.now() } } });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 