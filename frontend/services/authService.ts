import { User } from '../types';
import { authApi, getToken, removeToken } from './api';

// Admin emails that get admin role
const ADMIN_EMAILS = ['admin@aura.com', 'concierge@aura.com'];

// Admin phone numbers that get admin role
const ADMIN_PHONES = ['+919999999999'];

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  demoCode?: string; // For development mode only
}

// Send OTP to email
export const sendOtp = async (email: string): Promise<AuthResponse> => {
  try {
    const result = await authApi.sendOtp(email);
    
    if (result.success) {
      return {
        success: true,
        message: result.message || 'OTP sent successfully',
        demoCode: result.demoCode, // Only available in development
      };
    }
    
    return {
      success: false,
      message: result.error || 'Failed to send OTP',
    };
  } catch (error) {
    console.error('Send OTP error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

// Send OTP to phone
export const sendOtpPhone = async (phone: string): Promise<AuthResponse> => {
  try {
    const result = await authApi.sendOtpPhone(phone);
    
    if (result.success) {
      return {
        success: true,
        message: result.message || 'OTP sent successfully',
        demoCode: result.demoCode, // Only available in development
      };
    }
    
    return {
      success: false,
      message: result.error || 'Failed to send OTP',
    };
  } catch (error) {
    console.error('Send phone OTP error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

// Verify OTP and login (Email)
export const verifyOtpAndLogin = async (
  email: string,
  code: string
): Promise<AuthResponse> => {
  try {
    const result = await authApi.verifyOtp(email, code);
    
    if (result.success && result.user) {
      return {
        success: true,
        user: result.user,
      };
    }
    
    return {
      success: false,
      message: result.error || 'Verification failed',
    };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

// Verify OTP and login (Phone)
export const verifyOtpPhoneAndLogin = async (
  phone: string,
  code: string
): Promise<AuthResponse> => {
  try {
    const result = await authApi.verifyOtpPhone(phone, code);
    
    if (result.success && result.user) {
      return {
        success: true,
        user: result.user,
      };
    }
    
    return {
      success: false,
      message: result.error || 'Verification failed',
    };
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};

// Check if user is logged in (from stored token)
export const checkAuth = async (): Promise<AuthResponse> => {
  try {
    const token = getToken();
    
    if (!token) {
      return { success: false };
    }
    
    const result = await authApi.getCurrentUser();
    
    if (result.success && result.user) {
      return {
        success: true,
        user: result.user,
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Check auth error:', error);
    return { success: false };
  }
};

// Logout
export const logout = (): void => {
  removeToken();
};

// Check if email is admin
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Legacy exports for backward compatibility
export const sendMagicLink = sendOtp;

export const verifyMagicToken = async (
  email: string,
  token: string
): Promise<AuthResponse> => {
  // Magic link is now handled as OTP
  return verifyOtpAndLogin(email, token);
};
