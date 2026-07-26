import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password?: string;

  role: 'super_admin' | 'space_admin' | 'member' | 'guest';

  organizationId?: mongoose.Types.ObjectId;

  department?: string;
  photoUrl?: string;
  phone?: string;

  isVerified: boolean;
  isActive: boolean;

  lastLogin?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ['super_admin', 'space_admin', 'member', 'guest'],
      default: 'member',
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },

    photoUrl: {
      type: String,
    },

    phone: {
      type: String,
      trim: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


UserSchema.index({ organizationId: 1 });
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);