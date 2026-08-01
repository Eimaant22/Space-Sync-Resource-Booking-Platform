import {Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import Organization from '../models/Organization';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

import AppError from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import Resource from '../models/Resource';
import AccessGroup from '../models/AccessGroup';

/**
 * POST /api/organizations
 * Super Admin
 */
export const createOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      description,
      address,
      city,
      country,
      timezone,
      logoUrl,
    } = req.body;

    if (!name) {
      throw new AppError(
        'Organization name is required.',
        422,
        'VALIDATION_ERROR'
      );
    }

    const existing = await Organization.findOne({
      name: name.trim(),
    });

    if (existing) {
      throw new AppError(
        'Organization with this name already exists.',
        409,
        'ORGANIZATION_EXISTS'
      );
    }

    const organization = await Organization.create({
      name: name.trim(),
      description,
      address,
      city,
      country,
      timezone,
      logoUrl,
      createdBy: req.userId,
    });

    await AuditLog.create({
      userId: req.userId,
      action: 'Create Organization',
      module: 'Organization',
      entityId: organization._id,
      description: `Created organization "${organization.name}"`,
      ipAddress: req.ip,
    });

    sendSuccess(
      res,
      {
        message: 'Organization created successfully.',
        organization,
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/organizations
 * Super Admin
 */
export const getOrganizations = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizations = await Organization.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    sendSuccess(res, {
      organizations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/organizations/:id
 * Super Admin / Space Admin
 */
export const getOrganizationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      throw new AppError(
        'Invalid organization id.',
        400,
        'INVALID_ID'
      );
    }

    const organization = await Organization.findById(id)
      .populate('createdBy', 'name email');

    if (!organization) {
      throw new AppError(
        'Organization not found.',
        404,
        'ORGANIZATION_NOT_FOUND'
      );
    }

    sendSuccess(res, {
      organization,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/organizations/:id
 * Super Admin
 */
export const updateOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      throw new AppError(
        'Invalid organization id.',
        400,
        'INVALID_ID'
      );
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      throw new AppError(
        'Organization not found.',
        404,
        'ORGANIZATION_NOT_FOUND'
      );
    }

    const {
      name,
      description,
      address,
      city,
      country,
      timezone,
      logoUrl,
      isActive,
    } = req.body;

    if (name && name !== organization.name) {
      const existing = await Organization.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });

      if (existing) {
        throw new AppError(
          'Organization name already exists.',
          409,
          'ORGANIZATION_EXISTS'
        );
      }

      organization.name = name.trim();
    }

    if (description !== undefined)
      organization.description = description;

    if (address !== undefined)
      organization.address = address;

    if (city !== undefined)
      organization.city = city;

    if (country !== undefined)
      organization.country = country;

    if (timezone !== undefined)
      organization.timezone = timezone;

    if (logoUrl !== undefined)
      organization.logoUrl = logoUrl;

    if (isActive !== undefined)
      organization.isActive = isActive;

    await organization.save();

    await AuditLog.create({
      userId: req.userId,
      action: 'Update Organization',
      module: 'Organization',
      entityId: organization._id,
      description: `Updated organization "${organization.name}"`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message: 'Organization updated successfully.',
      organization,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/organizations/:id
 * Super Admin
 */
export const deleteOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid organization id.',
        400,
        'INVALID_ID'
      );
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      throw new AppError(
        'Organization not found.',
        404,
        'ORGANIZATION_NOT_FOUND'
      );
    }

    const usersCount = await User.countDocuments({
      organizationId: organization._id,
      isActive: true,
    });

    const resourcesCount = await Resource.countDocuments({
      organizationId: organization._id,
      isActive: true,
    });

    if (usersCount > 0 || resourcesCount > 0) {
      throw new AppError(
        'Cannot delete organization because it still contains active users or resources.',
        400,
        'ORGANIZATION_NOT_EMPTY'
      );
    }

    organization.isActive = false;

    await organization.save();

    await AuditLog.create({
      userId: req.userId,
      action: 'Delete Organization',
      module: 'Organization',
      entityId: organization._id,
      description: `Deleted organization "${organization.name}"`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message: 'Organization deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
/**
 * POST /api/organizations/:id/space-admin
 * Super Admin
 */
export const assignSpaceAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();
    const userId = req.body.userId?.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid organization id.',
        400,
        'INVALID_ID'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError(
        'Invalid user id.',
        400,
        'INVALID_ID'
      );
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      throw new AppError(
        'Organization not found.',
        404,
        'ORGANIZATION_NOT_FOUND'
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

    if (!user.isVerified) {
      throw new AppError(
        'User must verify the account before becoming Space Admin.',
        400,
        'USER_NOT_VERIFIED'
      );
    }

    if (
      user.organizationId &&
      user.organizationId.toString() !== organization._id.toString()
    ) {
      throw new AppError(
        'User already belongs to another organization.',
        400,
        'USER_ALREADY_ASSIGNED'
      );
    }

    user.role = 'space_admin';
    user.organizationId =
      organization._id as mongoose.Types.ObjectId;

    await user.save();

    // Save Audit Log
    await AuditLog.create({
      userId: req.userId,
      action: 'Assign Space Admin',
      module: 'Organization',
      entityId: organization._id,
      description: `Assigned "${user.name}" (${user.email}) as Space Admin for organization "${organization.name}".`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message: 'Space Admin assigned successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * PATCH /api/organizations/remove-user/:userId
 * Space Admin
 */
export const removeUserFromOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    if (!currentUser.organizationId) {
      throw new AppError(
        'Organization not assigned.',
        400,
        'NO_ORGANIZATION'
      );
    }

    const userId = req.params.userId.toString();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError(
        'Invalid user id.',
        400,
        'INVALID_ID'
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

    if (
      !user.organizationId ||
      user.organizationId.toString() !==
      currentUser.organizationId.toString()
    ) {
      throw new AppError(
        'User does not belong to your organization.',
        400,
        'INVALID_USER'
      );
    }

    // Remove user from every access group
    await AccessGroup.updateMany(
      {
        organizationId: currentUser.organizationId,
      },
      {
        $pull: {
          users: user._id,
        },
      }
    );

    //set organizatiOn to null
    user.organizationId = undefined;
    await user.save();

    sendSuccess(res, {
      message:
        'User removed from organization successfully.',
      user,
    });

  } catch (err) {
    next(err);
  }
};


/**
 * PATCH /api/organizations/:id/space-admin/:userId
 * Super Admin
 */
export const removeSpaceAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();
    const userId = req.params.userId.toString();

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid id.', 400, 'INVALID_ID');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (!user.organizationId || user.organizationId.toString() !== id) {
      throw new AppError('User does not belong to this organization.', 400, 'INVALID_USER');
    }

    user.organizationId = undefined;
    await user.save();

    await AuditLog.create({
      userId: req.userId,
      action: 'Remove Space Admin',
      module: 'Organization',
      entityId: id,
      description: `Removed space admin "${user.name}" (${user.email}).`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message: 'Space Admin removed successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};