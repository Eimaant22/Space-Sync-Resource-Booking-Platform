import mongoose, { Document, Schema } from 'mongoose';

export interface IResource extends Document {
  name: string;

  type:
    | 'room'
    | 'lab'
    | 'desk'
    | 'equipment'
    | 'vehicle'
    | 'court'
    | 'other';

  organizationId: mongoose.Types.ObjectId;

accessGroupId?: mongoose.Types.ObjectId | null;

  building?: string;

  location?: string;

  capacity?: number;

  amenities: string[];

  photoUrl?: string;

  requiresApproval: boolean;

  bufferTime: number;

  isActive: boolean;

  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        'room',
        'lab',
        'desk',
        'equipment',
        'vehicle',
        'court',
        'other',
      ],
      required: true,
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

  accessGroupId: {
  type: Schema.Types.ObjectId,
  ref: 'AccessGroup',
  default: null,
},

    building: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },

    amenities: [
      {
        type: String,
      },
    ],

    photoUrl: {
      type: String,
    },

    requiresApproval: {
      type: Boolean,
      default: false,
    },

    bufferTime: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ResourceSchema.index({ organizationId: 1 });
ResourceSchema.index({ type: 1 });
ResourceSchema.index({ accessGroupId: 1 });

export default mongoose.model<IResource>(
  'Resource',
  ResourceSchema
);