import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

import User from '../models/User';

import { comparePassword, hashPassword } from '../utils/hash';
import { signToken, getTokenTTL } from '../utils/jwt';
import { sendSuccess } from '../utils/response';
import AppError from '../utils/AppError';

import redisClient from '../config/redis';
import { AuthRequest } from '../middleware/auth';

import {
  sendResetOTP,
  verifyResetOTP,
  storeResetToken,
  verifyResetToken,
} from '../utils/otp';


// POST /api/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const {
      identifier,
      password,
    } = req.body;

    if (
      !identifier ||
      !password
    ) {
      throw new AppError(
        'identifier (email or username) and password are required.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const isEmail =
      identifier.includes('@');

    const query = isEmail
      ? {
          email:
            identifier.toLowerCase(),
        }
      : {
          username:
            identifier.toLowerCase(),
        };

    const user =
      await User.findOne(query)
        .select('+password');

    if (
      !user ||
      !user.password
    ) {
      throw new AppError(
        'Credentials are incorrect.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    if (!user.isActive) {
      throw new AppError(
        'Your account is inactive.',
        403,
        'ACCOUNT_INACTIVE'
      );
    }

    const match =
      await comparePassword(
        password,
        user.password
      );

    if (!match) {
      throw new AppError(
        'Credentials are incorrect.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    const token = signToken(
      user._id.toString()
    );

    sendSuccess(res, {
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId:
          user.organizationId,
      },
      token,
    });

  } catch (err) {
    next(err);
  }
};


// POST /api/auth/logout
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const token =
      req.headers.authorization!
        .split(' ')[1];

    const ttl =
      getTokenTTL(token);

    if (ttl > 0) {
      await redisClient.set(
        `blacklist:${token}`,
        '1',
        {
          EX: ttl,
        }
      );
    }

    sendSuccess(res, {
      message:
        'Logged out successfully.',
    });

  } catch (err) {
    next(err);
  }
};


// POST /api/auth/forgot-password
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const { email } = req.body;

    if (!email) {
      throw new AppError(
        'email is required.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const user =
      await User.findOne({
        email,
        isVerified: true,
      });

    if (user) {
      await sendResetOTP(email);
    }

    sendSuccess(res, {
      message:
        'If an account with that email exists, an OTP has been sent.',
    });

  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-reset-otp
export const verifyResetOTPHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const {
      email,
      otp,
    } = req.body;

    if (!email || !otp) {
      throw new AppError(
        'email and otp are required.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const valid =
      await verifyResetOTP(
        email,
        otp
      );

    if (!valid) {
      throw new AppError(
        'Invalid or expired OTP.',
        400,
        'INVALID_OTP'
      );
    }

    const resetToken =
      crypto
        .randomBytes(32)
        .toString('hex');

    await storeResetToken(
      email,
      resetToken
    );

    sendSuccess(res, {
      message:
        'OTP verified. Use the resetToken to set a new password.',
      resetToken,
    });

  } catch (err) {
    next(err);
  }
};


// POST /api/auth/reset-password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const {
      email,
      resetToken,
      newPassword,
    } = req.body;

    if (
      !email ||
      !resetToken ||
      !newPassword
    ) {
      throw new AppError(
        'email, resetToken, and newPassword are required.',
        422,
        'VALIDATION_ERROR'
      );
    }

    if (newPassword.length < 8) {
      throw new AppError(
        'newPassword must be at least 8 characters.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const valid =
      await verifyResetToken(
        email,
        resetToken
      );

    if (!valid) {
      throw new AppError(
        'Invalid or expired reset token.',
        400,
        'INVALID_RESET_TOKEN'
      );
    }

    const hashed =
      await hashPassword(
        newPassword
      );

    const user =
      await User.findOneAndUpdate(
        {
          email,
          isVerified: true,
        },
        {
          password: hashed,
        },
        {
          new: true,
        }
      );

    if (!user) {
      throw new AppError(
        'No account found for this email.',
        404,
        'USER_NOT_FOUND'
      );
    }

    sendSuccess(res, {
      message:
        'Password reset successfully. Please log in.',
    });

  } catch (err) {
    next(err);
  }
};