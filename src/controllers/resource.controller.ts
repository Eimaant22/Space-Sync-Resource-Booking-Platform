import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import Resource from '../models/Resource';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import Booking from '../models/Booking';

import AppError from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import AccessGroup from '../models/AccessGroup';


/**
 * POST /api/resources
 * Space Admin
 */
export const createResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!.toString();

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
      type,
      building,
      location,
      capacity,
      amenities,
      photoUrl,
      requiresApproval,
      bufferTime,
      accessGroupId,
    } = req.body;

    if (!name || !type) {
      throw new AppError(
        'Name and type are required.',
        422,
        'VALIDATION_ERROR'
      );
    }

    // Validate resource type
    const allowedTypes = [
      'room',
      'lab',
      'desk',
      'equipment',
      'vehicle',
      'court',
      'other',
    ];

    if (!allowedTypes.includes(type)) {
      throw new AppError(
        'Invalid resource type.',
        422,
        'INVALID_RESOURCE_TYPE'
      );
    }

    // Validate Access Group (if provided)
    if (
      accessGroupId !== undefined &&
      accessGroupId !== null &&
      accessGroupId !== ''
    ) {
      if (!mongoose.Types.ObjectId.isValid(accessGroupId)) {
        throw new AppError(
          'Invalid access group id.',
          400,
          'INVALID_ID'
        );
      }

      const accessGroup =
        await AccessGroup.findById(accessGroupId);

      if (!accessGroup) {
        throw new AppError(
          'Access group not found.',
          404,
          'ACCESS_GROUP_NOT_FOUND'
        );
      }

      // Ensure the access group belongs to the same organization
      if (
        accessGroup.organizationId.toString() !==
        user.organizationId?.toString()
      ) {
        throw new AppError(
          'Access group does not belong to your organization.',
          403,
          'FORBIDDEN'
        );
      }
    }

    const existing = await Resource.findOne({
      name: {
        $regex: new RegExp(
          `^${name.trim()}$`,
          'i'
        ),
      },
      organizationId: user.organizationId,
    });

    if (existing) {
      throw new AppError(
        'A resource with this name already exists.',
        409,
        'RESOURCE_EXISTS'
      );
    }

    const resource = await Resource.create({
      name: name.trim(),
      type,
      building,
      location,
      capacity,
      amenities,
      photoUrl,
      requiresApproval,
      bufferTime,
      accessGroupId:
        accessGroupId === '' ||
        accessGroupId === null
          ? null
          : accessGroupId,
      organizationId: user.organizationId,
      createdBy: user._id,
    });

    await AuditLog.create({
      userId: user._id,
      action: 'Create Resource',
      module: 'Resource',
      entityId: resource._id,
      description: `Created resource "${resource.name}"`,
      ipAddress: req.ip,
    });

    sendSuccess(
      res,
      {
        message: 'Resource created successfully.',
        resource,
      },
      201
    );
  } catch (err) {
    next(err);
  }
};


 // GET /api/resources/search
 //Search resources based on user role
 
export const searchAvailableResources = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!.toString();

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const {
      search,
      type,
      building,
      requiresApproval,
    } = req.query;

    const filter: any = {
      isActive: true,
    };

    // Super Admin
    if (user.role === 'super_admin') {
      // No organization restriction
    }

    // Space Admin
    else if (user.role === 'space_admin') {
      filter.organizationId = user.organizationId;
    }

    // Member / Guest
    else {
      const groups = await AccessGroup.find({
        organizationId: user.organizationId,
        users: user._id,
      }).select('_id');

      if (groups.length === 0) {
        throw new AppError(
          'You are not assigned to any access group.',
          403,
          'ACCESS_GROUP_REQUIRED'
        );
      }

      const groupIds = groups.map(group => group._id);

      filter.organizationId = user.organizationId;
      filter.accessGroupId = {
        $in: groupIds,
      };
    }

   
    if (search) {
      filter.name = {
        $regex: String(search),
        $options: 'i',
      };
    }

   
    if (type) {
      filter.type = String(type).toLowerCase();
    }

  
    if (building) {
      filter.building = {
        $regex: String(building),
        $options: 'i',
      };
    }


    if (requiresApproval !== undefined) {
      filter.requiresApproval =
        requiresApproval === 'true';
    }

    const resources = await Resource.find(filter)
      .populate('createdBy', 'name email')
      .populate('organizationId', 'name')
      .populate('accessGroupId', 'name')
      .sort({
        createdAt: -1,
      });

    sendSuccess(res, {
      resources,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/resources/:id
 * Logged-in Users
 */
export const getResourceById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid resource id.',
        400,
        'INVALID_ID'
      );
    }

    const loggedInUser = await User.findById(
      req.userId
    );

    if (!loggedInUser) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const resource = await Resource.findById(id)
      .populate('createdBy', 'name email')
      .populate('organizationId', 'name')
      .populate('accessGroupId', 'name');

    if (!resource) {
      throw new AppError(
        'Resource not found.',
        404,
        'RESOURCE_NOT_FOUND'
      );
    }

    if (
      loggedInUser.role !== 'super_admin' &&
      resource.organizationId &&
      resource.organizationId._id.toString() !==
        loggedInUser.organizationId?.toString()
    ) {
      throw new AppError(
        'You are not authorized to access this resource.',
        403,
        'FORBIDDEN'
      );
    }

    sendSuccess(res, {
      resource,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * PATCH /api/resources/:id
 * Space Admin
 */
export const updateResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid resource id.',
        400,
        'INVALID_ID'
      );
    }

    const userId = req.userId!.toString();

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const resource = await Resource.findById(id);

    if (!resource) {
      throw new AppError(
        'Resource not found.',
        404,
        'RESOURCE_NOT_FOUND'
      );
    }

    // Organization Ownership Check
    if (
      resource.organizationId.toString() !==
      user.organizationId?.toString()
    ) {
      throw new AppError(
        'You are not authorized to update this resource.',
        403,
        'FORBIDDEN'
      );
    }

    const {
      name,
      type,
      building,
      location,
      capacity,
      amenities,
      photoUrl,
      requiresApproval,
      bufferTime,
      accessGroupId,
    } = req.body;

    // Validate Resource Type
    if (
      type !== undefined &&
      ![
        'room',
        'lab',
        'desk',
        'equipment',
        'vehicle',
        'court',
        'other',
      ].includes(type)
    ) {
      throw new AppError(
        'Invalid resource type.',
        422,
        'VALIDATION_ERROR'
      );
    }

    // Validate Capacity
    if (
      capacity !== undefined &&
      (typeof capacity !== 'number' ||
        capacity < 1)
    ) {
      throw new AppError(
        'Capacity must be at least 1.',
        422,
        'VALIDATION_ERROR'
      );
    }

  
    if (accessGroupId !== undefined) {
      if (
        accessGroupId !== null &&
        accessGroupId !== ''
      ) {
        if (
          !mongoose.Types.ObjectId.isValid(
            accessGroupId
          )
        ) {
          throw new AppError(
            'Invalid access group id.',
            400,
            'INVALID_ID'
          );
        }

        const accessGroup =
          await AccessGroup.findOne({
            _id: accessGroupId,
            organizationId:
              user.organizationId,
          });

        if (!accessGroup) {
          throw new AppError(
            'Access group not found.',
            404,
            'ACCESS_GROUP_NOT_FOUND'
          );
        }

        resource.accessGroupId =
          accessGroup._id;
      } else {
        
        resource.accessGroupId = null;
      }
    }

    // Update Fields
    if (name !== undefined)
      resource.name = name.trim();

    if (type !== undefined)
      resource.type = type;

    if (building !== undefined)
      resource.building = building;

    if (location !== undefined)
      resource.location = location;

    if (capacity !== undefined)
      resource.capacity = capacity;

    if (amenities !== undefined)
      resource.amenities = amenities;

    if (photoUrl !== undefined)
      resource.photoUrl = photoUrl;

    if (
      requiresApproval !== undefined
    )
      resource.requiresApproval =
        requiresApproval;

    if (bufferTime !== undefined)
      resource.bufferTime =
        bufferTime;

    await resource.save();

    await AuditLog.create({
      userId: user._id,
      action: 'Update Resource',
      module: 'Resource',
      entityId: resource._id,
      description: `Updated resource "${resource.name}"`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message:
        'Resource updated successfully.',
      resource,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * PATCH /api/resources/:id/status
 * Space Admin
 */
export const updateResourceStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid resource id.',
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

    const userId = req.userId!.toString();

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const resource = await Resource.findById(id);

    if (!resource) {
      throw new AppError(
        'Resource not found.',
        404,
        'RESOURCE_NOT_FOUND'
      );
    }

    if (
      resource.organizationId.toString() !==
      user.organizationId?.toString()
    ) {
      throw new AppError(
        'You are not authorized to update this resource.',
        403,
        'FORBIDDEN'
      );
    }

    resource.isActive = isActive;

    await resource.save();

    await AuditLog.create({
      userId: user._id,
      action: isActive
        ? 'Activate Resource'
        : 'Deactivate Resource',
      module: 'Resource',
      entityId: resource._id,
      description: `${isActive ? 'Activated' : 'Deactivated'} resource "${resource.name}"`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message: 'Resource status updated successfully.',
      resource,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * DELETE /api/resources/:id
 * Space Admin
 */
export const deleteResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        'Invalid resource id.',
        400,
        'INVALID_ID'
      );
    }

    const userId = req.userId!.toString();

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    const resource = await Resource.findById(id);

    if (!resource) {
      throw new AppError(
        'Resource not found.',
        404,
        'RESOURCE_NOT_FOUND'
      );
    }

    // Organization Ownership Check
    if (
      resource.organizationId.toString() !==
      user.organizationId?.toString()
    ) {
      throw new AppError(
        'You are not authorized to delete this resource.',
        403,
        'FORBIDDEN'
      );
    }

    // Prevent deletion if future bookings exist
    const futureBookings = await Booking.countDocuments({
      resourceId: resource._id,
      startTime: { $gte: new Date() },
      status: {
        $in: [
          'pending',
          'approved',
          'completed',
        ],
      },
    });

    if (futureBookings > 0) {
      throw new AppError(
        'Resource has active or upcoming bookings and cannot be deleted.',
        400,
        'RESOURCE_HAS_ACTIVE_BOOKINGS'
      );
    }

    // Soft Delete
    resource.isActive = false;

    await resource.save();

    await AuditLog.create({
      userId: user._id,
      action: 'Delete Resource',
      module: 'Resource',
      entityId: resource._id,
      description: `Deleted resource "${resource.name}"`,
      ipAddress: req.ip,
    });

    sendSuccess(res, {
      message: 'Resource deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/resources/available
 * Logged-in Users
 */
export const getAvailableResources = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!.toString();

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND'
      );
    }

    let resources;

    
    
     
    if (user.role === 'super_admin') {
      resources = await Resource.find({
        isActive: true,
      })
        .populate('createdBy', 'name email')
        .populate('organizationId', 'name')
        .populate('accessGroupId', 'name')
        .sort({
          createdAt: -1,
        });
    }

   
    else if (user.role === 'space_admin') {
      resources = await Resource.find({
        organizationId: user.organizationId,
        isActive: true,
      })
        .populate('createdBy', 'name email')
        .populate('organizationId', 'name')
        .populate('accessGroupId', 'name')
        .sort({
          createdAt: -1,
        });
    }

   
    else {
      const groups = await AccessGroup.find({
        organizationId: user.organizationId,
        users: user._id,
      }).select('_id');

      if (groups.length === 0) {
        throw new AppError(
          'You are not assigned to any access group.',
          403,
          'ACCESS_GROUP_REQUIRED'
        );
      }

      const groupIds = groups.map(group => group._id);

      resources = await Resource.find({
        organizationId: user.organizationId,
        isActive: true,
        accessGroupId: {
          $in: groupIds,
        },
      })
        .populate('createdBy', 'name email')
        .populate('organizationId', 'name')
        .populate('accessGroupId', 'name')
        .sort({
          createdAt: -1,
        });
    }

    sendSuccess(res, {
      resources,
    });
  } catch (err) {
    next(err);
  }
};