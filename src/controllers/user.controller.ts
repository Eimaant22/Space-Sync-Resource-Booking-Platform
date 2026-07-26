import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import User from '../models/User';

import AppError from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/users/profile
 * Logged-in User
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId?.toString();

    if (!userId) {
      throw new AppError(
        'Authentication required.',
        401,
        'UNAUTHENTICATED'
      );
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    sendSuccess(res, {
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/profile
 * Logged-in User
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId?.toString();

    if (!userId) {
      throw new AppError(
        'Authentication required.',
        401,
        'UNAUTHENTICATED'
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const {
      name,
      phone,
      photoUrl,
    } = req.body;

    if (name !== undefined) {
      user.name = name;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }


    if (photoUrl !== undefined) {
      user.photoUrl = photoUrl;
    }

    await user.save();

    sendSuccess(res, {
      message: 'Profile updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users
 * Super Admin / Space Admin
 */
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loggedInUserId = req.userId?.toString();

    if (!loggedInUserId) {
      throw new AppError(
        'Authentication required.',
        401,
        'UNAUTHENTICATED'
      );
    }

    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const { search, role, isActive } = req.query;

    const filter: any = {};

    if (loggedInUser.role === 'space_admin') {
      filter.organizationId = loggedInUser.organizationId;
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          username: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('organizationId', 'name')
      .sort({
        createdAt: -1,
      });

    sendSuccess(res, {
      users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Super Admin / Space Admin
 */
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid user id.',
        400,
        'INVALID_ID'
      );
    }

    const loggedInUserId = req.userId?.toString();

    if (!loggedInUserId) {
      throw new AppError(
        'Authentication required.',
        401,
        'UNAUTHENTICATED'
      );
    }

    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('organizationId', 'name');

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    if (
      loggedInUser.role === 'space_admin' &&
      loggedInUser.organizationId?.toString() !==
        user.organizationId?.toString()
    ) {
      throw new AppError(
        'You are not authorized to view this user.',
        403,
        'FORBIDDEN'
      );
    }

    sendSuccess(res, {
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/role
 * Super Admin
 */
export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid user id.',
        400,
        'INVALID_ID'
      );
    }

    const loggedInUserId = req.userId?.toString();

    if (!loggedInUserId) {
      throw new AppError(
        'Authentication required.',
        401,
        'UNAUTHENTICATED'
      );
    }

    const { role } = req.body;

    if (!role) {
      throw new AppError(
        'Role is required.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const allowedRoles = [
      'space_admin',
      'member',
      'guest',
    ];

    if (!allowedRoles.includes(role)) {
      throw new AppError(
        'Invalid role.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    if (user.role === 'super_admin') {
      throw new AppError(
        'Super Admin role cannot be changed.',
        403,
        'FORBIDDEN'
      );
    }

    if (user._id.toString() === loggedInUserId) {
      throw new AppError(
        'You cannot change your own role.',
        400,
        'SELF_ROLE_CHANGE_NOT_ALLOWED'
      );
    }

    user.role = role;

    await user.save();

    sendSuccess(res, {
      message: 'User role updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * PATCH /api/users/:id/status
 * Super Admin / Space Admin
 */
export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid user id.',
        400,
        'INVALID_ID'
      );
    }

    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new AppError(
        'isActive must be true or false.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const loggedInUserId = req.userId?.toString();

    if (!loggedInUserId) {
      throw new AppError(
        'Authentication required.',
        401,
        'UNAUTHENTICATED'
      );
    }

    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    if (
      loggedInUser.role === 'space_admin' &&
      loggedInUser.organizationId?.toString() !==
        user.organizationId?.toString()
    ) {
      throw new AppError(
        'You are not authorized to update this user.',
        403,
        'FORBIDDEN'
      );
    }

    if (user._id.toString() === loggedInUserId) {
      throw new AppError(
        'You cannot deactivate your own account.',
        400,
        'SELF_DEACTIVATION_NOT_ALLOWED'
      );
    }

    user.isActive = isActive;

    await user.save();

    sendSuccess(res, {
      message: 'User status updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * DELETE /api/users/:id
 * Super Admin
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid user id.',
        400,
        'INVALID_ID'
      );
    }

    const loggedInUserId = req.userId?.toString();

    if (!loggedInUserId) {
      throw new AppError(
        'Authentication required.',
        401,
        'UNAUTHENTICATED'
      );
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    if (user.role === 'super_admin') {
      throw new AppError(
        'Super Admin cannot be deleted.',
        403,
        'FORBIDDEN'
      );
    }

    if (user._id.toString() === loggedInUserId) {
      throw new AppError(
        'You cannot delete your own account.',
        400,
        'SELF_DELETE_NOT_ALLOWED'
      );
    }

    user.isActive = false;

    await user.save();

    sendSuccess(res, {
      message: 'User deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};