import mongoose, { Document, Schema } from 'mongoose';

export interface ISignupRequest extends Document {
  username: string;

  name: string;

  email: string;

  password: string;

  role: 'space_admin' | 'member' | 'guest';

  phone?: string;

  photoUrl?: string;

  status: 'pending' | 'approved' | 'rejected';

  approvedBy?: mongoose.Types.ObjectId;

  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const SignupRequestSchema = new Schema<ISignupRequest>(
  {
    username: {
      type: String,
      required: true,
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
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['space_admin', 'member', 'guest'],
      default: 'member',
    },

    phone: {
      type: String,
      trim: true,
    },

    photoUrl: {
      type: String,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

SignupRequestSchema.index({ email: 1 });

SignupRequestSchema.index({ username: 1 });

SignupRequestSchema.index({ status: 1 });

SignupRequestSchema.index({ createdAt: -1 });

export default mongoose.model<ISignupRequest>(
  'SignupRequest',
  SignupRequestSchema
);