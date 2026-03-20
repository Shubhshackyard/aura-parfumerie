import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTPEmail } from '../services/emailService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Admin emails that get admin role
const ADMIN_EMAILS = ['admin@aura.com', 'concierge@aura.com'];

// Admin phone numbers that get admin role
const ADMIN_PHONES = ['+919999999999'];

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token - now supports phone as identifier
const generateToken = (userId: string, identifier: string, role: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { userId, identifier, role },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

const isDemoOtpMode = (): boolean => {
  return process.env.OTP_DEMO_MODE === 'true';
};

// Normalize phone number (remove spaces, ensure +91 prefix for India)
const normalizePhone = (phone: string): string => {
  // Remove all spaces, dashes, and parentheses
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0, replace with +91
  if (normalized.startsWith('0')) {
    normalized = '+91' + normalized.slice(1);
  }
  
  // If no country code, assume India (+91)
  if (!normalized.startsWith('+')) {
    normalized = '+91' + normalized;
  }
  
  return normalized;
};

// Validate phone number format
const isValidPhone = (phone: string): boolean => {
  // After normalization, should be +[country code][number], e.g., +919876543210
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  return phoneRegex.test(phone);
};

// POST /api/auth/send-otp (Email)
router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Determine role based on email
      const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'customer';
      
      user = new User({
        email: email.toLowerCase(),
        name: email.split('@')[0], // Default name from email
        role,
        otp: { code: otp, expiresAt: otpExpiry },
      });
    } else {
      // Update existing user's OTP
      user.otp = { code: otp, expiresAt: otpExpiry };
    }

    await user.save();

    if (isDemoOtpMode()) {
      res.json({
        message: 'OTP sent successfully (demo mode)',
        demoCode: otp,
      });
      return;
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      res.status(500).json({ error: 'Failed to send OTP email' });
      return;
    }

    // In development, include the OTP in response for testing
    const response: { message: string; previewUrl?: string; demoCode?: string } = {
      message: 'OTP sent successfully',
    };

    if (emailResult.previewUrl) {
      response.previewUrl = emailResult.previewUrl;
    }

    // Include demo code in development mode
    if (process.env.NODE_ENV !== 'production') {
      response.demoCode = otp;
    }

    res.json(response);
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/send-otp-phone (Phone)
router.post('/send-otp-phone', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Normalize and validate phone
    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      res.status(400).json({ error: 'Invalid phone number format' });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user by phone
    let user = await User.findOne({ phone: normalizedPhone });
    
    if (!user) {
      // Determine role based on phone
      const role = ADMIN_PHONES.includes(normalizedPhone) ? 'admin' : 'customer';
      
      user = new User({
        phone: normalizedPhone,
        name: `User ${normalizedPhone.slice(-4)}`, // Default name from last 4 digits
        role,
        otp: { code: otp, expiresAt: otpExpiry },
      });
    } else {
      // Update existing user's OTP
      user.otp = { code: otp, expiresAt: otpExpiry };
    }

    await user.save();

    if (isDemoOtpMode()) {
      res.json({
        message: 'OTP sent to your phone (demo mode)',
        demoCode: otp,
      });
      return;
    }

    // DEMO MODE: Log OTP to console instead of sending SMS
    console.log('========================================');
    console.log(`📱 PHONE OTP for ${normalizedPhone}: ${otp}`);
    console.log('========================================');

    // In a production environment, you would integrate with an SMS service here:
    // await sendSMS(normalizedPhone, `Your Aura verification code is: ${otp}`);

    const response: { message: string; demoCode?: string } = {
      message: 'OTP sent to your phone',
    };

    // Include demo code in development mode
    if (process.env.NODE_ENV !== 'production') {
      response.demoCode = otp;
    }

    res.json(response);
  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp (Email)
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: 'Email and OTP code are required' });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    // Check OTP
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      res.status(400).json({ error: 'No OTP found. Please request a new one.' });
      return;
    }

    // Check if OTP expired
    if (new Date() > user.otp.expiresAt) {
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    // Verify OTP
    if (user.otp.code !== code) {
      res.status(400).json({ error: 'Invalid OTP code' });
      return;
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(
      user._id.toString(),
      user.email || user.phone || '',
      user.role
    );

    // Return user data and token
    // Format address as string for frontend compatibility
    const addressStr = user.address 
      ? [user.address.street, user.address.city, user.address.state, user.address.zip, user.address.country]
          .filter(Boolean).join(', ')
      : undefined;

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: addressStr,
        preferences: user.preferences?.notes || [],
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/verify-otp-phone (Phone)
router.post('/verify-otp-phone', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      res.status(400).json({ error: 'Phone number and OTP code are required' });
      return;
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(phone);

    // Find user
    const user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    // Check OTP
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      res.status(400).json({ error: 'No OTP found. Please request a new one.' });
      return;
    }

    // Check if OTP expired
    if (new Date() > user.otp.expiresAt) {
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    // Verify OTP
    if (user.otp.code !== code) {
      res.status(400).json({ error: 'Invalid OTP code' });
      return;
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(
      user._id.toString(),
      user.phone || user.email || '',
      user.role
    );

    // Return user data and token
    const addressStr = user.address 
      ? [user.address.street, user.address.city, user.address.state, user.address.zip, user.address.country]
          .filter(Boolean).join(', ')
      : undefined;

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: addressStr,
        preferences: user.preferences?.notes || [],
      },
    });
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Format address as string for frontend compatibility
    const addressStr = user.address 
      ? [user.address.street, user.address.city, user.address.state, user.address.zip, user.address.country]
          .filter(Boolean).join(', ')
      : undefined;

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: addressStr,
        preferences: user.preferences?.notes || [],
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
