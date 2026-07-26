import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import SignupRequest from '../models/SignupRequest';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

import { hashPassword } from '../utils/hash';
import { sendSuccess } from '../utils/response';
import AppError from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';

import { sendSignupApprovedEmail } from '../utils/SignUpRequestEmail';
import { sendSignupRejectedEmail } from '../utils/SignUpRequestEmail';
import { resolve } from 'node:dns';

const isValidUsername = (
  username: string
): boolean => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(
    username
  );
};

/**
 * POST /api/signup-requests
 */
export const submitSignupRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      username,
      name,
      email,
      password,
      role,
      phone,
      photoUrl,
    } = req.body;

    if (
      !username ||
      !name ||
      !email ||
      !password ||
      !role
    ) {
      throw new AppError(
        'username, name, email,role  and password are required.',
        422,
        'VALIDATION_ERROR'
      );
    }

    if (!isValidUsername(username)) {
      throw new AppError(
        'Invalid username.',
        422,
        'VALIDATION_ERROR'
      );
    }

    if (password.length < 8) {
      throw new AppError(
        'Password must be at least 8 characters.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const allowedRoles = [
      'space_admin',
      'member',
      'guest',
    ];

    if (
      role &&
      !allowedRoles.includes(role)
    ) {
      throw new AppError(
        'Invalid role.',
        422,
        'INVALID_ROLE'
      );
    }

    const existingUser =
      await User.findOne({
        $or: [
          {
            email: email.toLowerCase(),
          },
          {
            username:
              username.toLowerCase(),
          },
        ],
      });

    if (existingUser) {
      throw new AppError(
        'User already exists.',
        409,
        'USER_ALREADY_EXISTS'
      );
    }

    const existingRequest =
      await SignupRequest.findOne({
        $or: [
          {
            email: email.toLowerCase(),
          },
          {
            username:
              username.toLowerCase(),
          },
        ],
        status: 'pending',
      });

    if (existingRequest) {
      throw new AppError(
        'A signup request is already pending.',
        409,
        'REQUEST_ALREADY_PENDING'
      );
    }

    const hashed =
      await hashPassword(password);

    const request =
      await SignupRequest.create({
        username:
          username.toLowerCase(),

        name,

        email:
          email.toLowerCase(),

        password: hashed,

        role:
          role || 'member',

        phone,

        photoUrl,
      });

    await AuditLog.create({
      action:
        'Submit Signup Request',

      module:
        'Signup Request',

      entityId: request._id,

      description: `${email} submitted a signup request.`,

      ipAddress: req.ip,
    });

    sendSuccess(
      res,
      {
        message:
          'Signup request submitted successfully. Please wait for approval from the Super Admin.',
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/signup-requests
 * Super Admin
 */
export const getSignupRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;

    const filter: any = {};

    if (status) {
      const allowedStatuses = [
        'pending',
        'approved',
        'rejected',
      ];

      if (
        typeof status !== 'string' ||
        !allowedStatuses.includes(status)
      ) {
        throw new AppError(
          'Invalid status filter.',
          422,
          'VALIDATION_ERROR'
        );
      }

      filter.status = status;
    }

    const requests = await SignupRequest.find(filter)
      .select('-password')
      .populate(
        'reviewedBy',
        'name email'
      )
      .sort({
        createdAt: -1,
      });

    sendSuccess(res, {
      requests,
    });
  } catch (err) {
    next(err);
  }
};


export const getSignupRequestById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid signup request id.',
        400,
        'INVALID_ID'
      );
    }

    const request = await SignupRequest.findById(id)
      .select('-password')
      .populate(
        'approvedBy',
        'name email role'
      );

    if (!request) {
      throw new AppError(
        'Signup request not found.',
        404,
        'REQUEST_NOT_FOUND'
      );
    }

    sendSuccess(res, {
      signupRequest: request,
    });

  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/signup-requests/:id/approve
 * Super Admin
 */
export const approveSignupRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid signup request id.',
        400,
        'INVALID_ID'
      );
    }

    const admin = await User.findById(req.userId);

    if (!admin) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const request = await SignupRequest.findById(id);

    if (!request) {
      throw new AppError(
        'Signup request not found.',
        404,
        'REQUEST_NOT_FOUND'
      );
    }

    if (request.status !== 'pending') {
      throw new AppError(
        'This request has already been processed.',
        400,
        'REQUEST_ALREADY_PROCESSED'
      );
    }

    const existingUser = await User.findOne({
      $or: [
        { email: request.email },
        { username: request.username }
      ]
    });

    if (existingUser) {
      throw new AppError(
        'User already exists.',
        409,
        'USER_ALREADY_EXISTS'
      );
    }

    const user = await User.create({
      username: request.username,
      name: request.name,
      email: request.email,
      password: request.password,
      role: request.role,
      phone: request.phone,
      photoUrl: request.photoUrl,
      isVerified: true,
      isActive: true,
    });

    request.status = 'approved';
    request.approvedBy = admin._id as mongoose.Types.ObjectId;
    request.approvedAt = new Date();

    await request.save();

    await sendSignupApprovedEmail(
      request.email,
      request.name
    );

    await AuditLog.create({
      userId: admin._id,
      action: 'Approve Signup Request',
      module: 'Signup Request',
      entityId: request._id,
      description: `Approved signup request for ${request.email}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message: 'Signup request approved successfully.',
      user,
    });

  } catch (err) {
    next(err);
  }
};



export const rejectSignupRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid signup request id.',
        400,
        'INVALID_ID'
      );
    }

    const admin = await User.findById(req.userId);

    if (!admin) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const request = await SignupRequest.findById(id);

    if (!request) {
      throw new AppError(
        'Signup request not found.',
        404,
        'REQUEST_NOT_FOUND'
      );
    }

    if (request.status !== 'pending') {
      throw new AppError(
        'This request has already been processed.',
        400,
        'REQUEST_ALREADY_PROCESSED'
      );
    }

    request.status = 'rejected';
    request.approvedBy = admin._id as mongoose.Types.ObjectId;
    request.approvedAt = new Date();

    await request.save();

    await sendSignupRejectedEmail(
      request.email,
      request.name
    );

    await AuditLog.create({
      userId: admin._id,
      action: 'Reject Signup Request',
      module: 'Signup Request',
      entityId: request._id,
      description: `Rejected signup request for ${request.email}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message: 'Signup request rejected successfully.',
    });

  } catch (err) {
    next(err);
  }
};


export const getSignupRequestHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const requests =
      await SignupRequest.find({
        status: {
          $in: [
            'approved',
            'rejected',
          ],
        },
      })
        .select('-password')
        .populate(
          'approvedBy',
          'name email role'
        )
        .sort({
          updatedAt: -1,
        });

    sendSuccess(res, {
      total: requests.length,
      signupRequests: requests,
    });

  } catch (err) {
    next(err);
  }
};

